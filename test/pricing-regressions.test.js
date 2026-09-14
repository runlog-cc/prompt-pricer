import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateModelCost,calculateMultiTurnConversationCost} from '../engine.js';
import {mergeOpenRouterModels,getModelById,filterModels} from '../models-data.js';
const model={id:'fixture',inputPricePerM:1,outputPricePerM:2,cachedInputPricePerM:0,thinkingPricePerM:0,supportsThinking:true};
const usage={totalInputTokens:1e6,expectedOutputTokens:0,thinkingTokens:1e6};
test('explicit free cached/reasoning rates remain zero in totals and savings',()=>{
 const c=calculateModelCost(model,usage,{isCached:true});assert.equal(c.totalCost,0);assert.equal(c.cachedTotalCost,0);assert.equal(c.savingsFromCache,1);
});
test('invalid pricing and usage cannot yield a usable estimate',()=>{
 for(const bad of [NaN,Infinity,-1]){
 assert.throws(()=>calculateModelCost({...model,inputPricePerM:bad},usage));
 assert.throws(()=>calculateModelCost(model,{...usage,totalInputTokens:bad}));
 }
 assert.throws(()=>calculateModelCost(model,usage,{scale:-1}));
});
test('exact aliases preserve base and dated variants independently of catalog order',()=>{
 const a={id:'openai/gpt-4o-mini',name:'same',pricing:{prompt:'0.00000015',completion:'0.0000006'}};
 const b={id:'openai/gpt-4o-mini-2024-07-18',name:'same',pricing:{prompt:'0.000000075',completion:'0.0000003'}};
 for(const list of [[a,b],[b,a]]){mergeOpenRouterModels(list);assert.equal(getModelById('gpt-4o-mini').inputPricePerM,.15);assert.equal(getModelById(b.id).inputPricePerM,.075);assert.equal(getModelById(a.id).canonicalId,a.id);}
});
test('missing/invalid prices are not promoted as free; explicit zeros are supported',()=>{
 mergeOpenRouterModels([{id:'fixture/missing',name:'Missing',pricing:{}},{id:'fixture/negative',pricing:{prompt:'-1',completion:'0'}},{id:'fixture/free',pricing:{prompt:'0',completion:'0'}}]);
 assert.equal(getModelById('fixture/missing'),undefined);assert.equal(getModelById('fixture/negative'),undefined);assert.equal(getModelById('fixture/free').inputPricePerM,0);
});

test('reasoning capability and provider filters survive catalog import',()=>{
 mergeOpenRouterModels([{id:'openai/o3',supported_parameters:['reasoning'],pricing:{prompt:'0.000002',completion:'0.000008'}}]);
 assert.equal(getModelById('openai/o3').supportsThinking,true);
 assert.ok(filterModels({provider:'OpenAI'}).some(m=>m.id==='openai/o3'));
});
test('conversation estimates reject invalid inputs and currencies',()=>{
 for(const v of [NaN,Infinity,-1])assert.throws(()=>calculateMultiTurnConversationCost(model,{userTokensPerTurn:v}));
 assert.throws(()=>calculateMultiTurnConversationCost(model,{currency:'XXX'}));
 assert.throws(()=>calculateMultiTurnConversationCost(model,{turns:0.5}));
});

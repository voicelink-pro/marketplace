import{describe,it,expect}from'vitest';import{commissionSplit}from'./calculator';
describe('explicit sandbox commission rounding',()=>{
 it('uses exact half-up amounts and preserves the split',()=>{expect(commissionSplit(1499n,1500,1000)).toEqual({gross:225n,platformFee:23n,creator:202n});expect(commissionSplit(1n,5000,5000)).toEqual({gross:1n,platformFee:1n,creator:0n})});
 it('handles large amounts without floats and bounds input',()=>{const r=commissionSplit(9999999999999999n,9999,9999);expect(r.creator+r.platformFee).toBe(r.gross);expect(()=>commissionSplit(-1n,1500,1000)).toThrow();expect(()=>commissionSplit(1n,1500,10001)).toThrow()});
});

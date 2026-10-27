export function commissionSplit(basis:bigint,commissionBps:number,platformFeeBps:number){
 if(basis<0n||basis>9999999999999999n)throw new Error('Invalid commission basis');
 for(const rate of[commissionBps,platformFeeBps])if(!Number.isInteger(rate)||rate<0||rate>10000)throw new Error('Invalid rate');
 // P-12 sandbox proposal: half up, then creator receives the exact remainder.
 const gross=(basis*BigInt(commissionBps)+5000n)/10000n;
 const platformFee=(gross*BigInt(platformFeeBps)+5000n)/10000n;
 return {gross,platformFee,creator:gross-platformFee};
}

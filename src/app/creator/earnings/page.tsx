import type{Metadata}from'next';import{PageHeader}from'@/components/layout/page-header';import{CommissionPanel}from'@/modules/commissions/components/commission-panel';
export const metadata:Metadata={title:'Earnings'};
export default function CreatorEarningsPage(){return <><PageHeader title="Earnings" description="Historical commission from paid subscription purchases, corrections and monthly statements."/><CommissionPanel/></>}

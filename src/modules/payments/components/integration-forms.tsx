'use client';
import {useActionState,useId} from 'react';
import {Field,FieldGroup,FieldLabel,FieldDescription} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {FieldErrors,FormMessage} from '@/components/forms/form-feedback';
import {SubmitButton} from '@/components/forms/submit-button';
import {idleFormState,type FormState} from '@/lib/forms';
import {configureIntegration,mapPlan,mapCustomer,mapReference,setSource,retryEvent,checkIntegration} from '../actions';
const actions={configure:configureIntegration,plan:mapPlan,customer:mapCustomer,reference:mapReference,source:setSource,retry:retryEvent,check:checkIntegration};
type FieldSpec={name:string;label:string;hint?:string;options?:{value:string;label:string}[]};
export function IntegrationForm({kind,fields=[],hidden={},label}:{kind:keyof typeof actions;fields?:FieldSpec[];hidden?:Record<string,string>;label:string}){
 const [state,action]=useActionState<FormState,FormData>(actions[kind],idleFormState);const id=useId();
 return <form action={action}><FieldGroup><FormMessage state={state}/>
  {Object.entries(hidden).map(([name,value])=><input key={name} type="hidden" name={name} value={value}/>)}
  {fields.map(field=><Field key={field.name} data-invalid={state.status==='error'&&Boolean(state.fieldErrors?.[field.name])}><FieldLabel htmlFor={id+field.name}>{field.label}</FieldLabel>
   {field.options?<select id={id+field.name} name={field.name} required className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose…</option>{field.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>:<Input id={id+field.name} name={field.name} required maxLength={200} autoComplete="off" defaultValue={state.status==='error'?state.values?.[field.name]:undefined}/>}
   <FieldErrors state={state} field={field.name}/>{field.hint?<FieldDescription>{field.hint}</FieldDescription>:null}
  </Field>)}
  <SubmitButton pendingLabel="Saving…">{label}</SubmitButton>
 </FieldGroup></form>;
}

// Owned NativeScript relay fixture. Uses real native view state and the shared
// action/readiness implementation; it never captures images or accesses user data.
export function devActionFixture(platform) {
  return `import '@valor/nativescript-websockets';
import {Application,Label} from '@nativescript/core';
import {setTimeout as nativeSetTimeout} from '@nativescript/core/timer';
import {registerDevAction,defineDevAction,attachDevActionHandler,startDevActionBridge} from './dev-actions-registry';
import {createReadinessScope} from './readiness-state';
const view=new Label(); view.text='Initial'; let value=1;
const thread=()=>typeof android==='undefined'?'ios':java.lang.Thread.currentThread().getName()+':main='+String(android.os.Looper.myLooper()===android.os.Looper.getMainLooper());
const diagnostics={timerCalled:false,nativeTimerCalled:false,timerError:'',scheduledThread:'',callbackThread:''};
const scope=createReadinessScope('Native fixture');
registerDevAction({id:'fixture.${platform}.read',title:'Read native fixture',description:'Read owned native state',effects:{summary:'Read only'},result:{fields:{value:{type:'integer'},text:{type:'string'},diagnostics:{type:'object',fields:{timerCalled:{type:'boolean'},nativeTimerCalled:{type:'boolean'},timerError:{type:'string'},scheduledThread:{type:'string'},callbackThread:{type:'string'}}}}},run:()=>({value,text:view.text,diagnostics})});
const prepare=defineDevAction({id:'fixture.${platform}.prepare',title:'Prepare native fixture',description:'Mutate owned native state and await registered work',effects:{summary:'Owned fixture only',appState:true},result:{fields:{value:{type:'integer'}}},execution:{cancellable:true,timeoutMs:3000}});
attachDevActionHandler(prepare,()=>{const release=scope.register({label:'Native update',pending:true,blocking:false}).dispose;diagnostics.scheduledThread=thread();nativeSetTimeout(()=>{diagnostics.nativeTimerCalled=true},100);setTimeout(()=>{diagnostics.timerCalled=true;diagnostics.callbackThread=thread();try{value=2;view.text='Prepared';release()}catch(error){diagnostics.timerError=String(error)}},80);return{value:2}},{label:'Native fixture',readiness:scope});
const stuck=defineDevAction({id:'fixture.${platform}.stuck',title:'Readiness timeout',description:'Exercise owned readiness deadline',effects:{summary:'Owned fixture only',appState:true},execution:{cancellable:true,timeoutMs:1000}});
attachDevActionHandler(stuck,()=>{scope.register({label:'Intentionally pending',pending:true});return{}},{label:'Pending owner',readiness:scope});
const failureScope=createReadinessScope('Recoverable native work');
const failed=defineDevAction({id:'fixture.${platform}.failed',title:'Readiness failure',description:'Reject failed background work',effects:{summary:'Owned fixture only',appState:true},execution:{timeoutMs:3000}});
attachDevActionHandler(failed,()=>{failureScope.register({label:'Fixture failure',pending:false,error:new Error('discarded detail'),blocking:false});return{}},{label:'Failure owner',readiness:failureScope});
const ownerScope=createReadinessScope('Detaching owner');
const owner=defineDevAction({id:'fixture.${platform}.detach',title:'Owner detach',description:'Cancel an owned wait on detach',effects:{summary:'Owned fixture only',appState:true},execution:{cancellable:true,timeoutMs:5000}});
const detach=attachDevActionHandler(owner,()=>{ownerScope.register({label:'Owned request',pending:true});setTimeout(()=>{detach();ownerScope.dispose()},50);return{}},{label:'Detaching owner',readiness:ownerScope});
registerDevAction({id:'fixture.${platform}.disconnect',title:'Disconnect owned bridge',description:'Observe an unknown in-flight outcome',effects:{summary:'Stops owned fixture bridge',appState:true},execution:{timeoutMs:5000},run:()=>{startDevActionBridge().stop();return new Promise(()=>{})}});
Application.run({create:()=>view});
`
}

export async function qualifyDevActionFixture(query, until, platform) {
  const invoke = async (name) => {
    const instance = query(['actions', 'list', '--json']).instances.find(
      (item) => item.platform === platform,
    )

    const accepted = query([
      'actions',
      'invoke',
      '--action',
      `fixture.${platform}.${name}`,
      '--instance',
      instance.appInstanceId,
      '--revision',
      String(instance.revision),
      '--request-key',
      `qualification-${platform}-${name}`,
    ])

    let job

    await until(() => {
      job = query(['actions', 'status', accepted.job.jobId]).job
      return !['queued', 'running', 'cancelling'].includes(job.state)
    }, `${platform} ${name} did not finish`)

    return job
  }

  const prepared = await invoke('prepare')
  const read = await invoke('read')

  if (
    prepared.state !== 'succeeded' ||
    prepared.result?.outcome?.readiness?.[0]?.pending?.length !== 0 ||
    prepared.result?.outcome?.handlers?.[0]?.label !== 'Native fixture'
  ) {
    throw Error(JSON.stringify({ prepared, read }))
  }

  if (
    read.state !== 'succeeded' ||
    read.result?.outcome?.result?.value !== 2 ||
    read.result?.outcome?.result?.text !== 'Prepared'
  ) {
    throw Error(JSON.stringify(read))
  }

  const failed = await invoke('failed')

  if (
    failed.state !== 'failed' ||
    failed.error?.context?.appCode !== 'readiness_failed' ||
    failed.error?.context?.readiness?.[0]?.pending?.length !== 0 ||
    failed.error?.context?.readiness?.[0]?.failures?.[0]?.label !== 'Fixture failure' ||
    JSON.stringify(failed).includes('discarded detail')
  ) {
    throw Error(JSON.stringify(failed))
  }

  const detached = await invoke('detach')

  if (detached.state !== 'cancelled' || detached.result?.outcome?.status !== 'cancelled') {
    throw Error(JSON.stringify(detached))
  }

  const timeout = await invoke('stuck')

  if (
    timeout.state !== 'failed' ||
    timeout.error?.context?.appCode !== 'readiness_timeout' ||
    !timeout.error?.context?.readiness?.[0]?.pending?.some(
      (work) => work.label === 'Intentionally pending',
    )
  ) {
    throw Error(JSON.stringify(timeout))
  }

  const disconnected = await invoke('disconnect')

  if (disconnected.state !== 'failed' || disconnected.error?.context?.outcome !== 'unknown') {
    throw Error(JSON.stringify(disconnected))
  }

  return {
    registeredFailure: failed.error.context.appCode,
    ownerDetach: detached.state,
    disconnectOutcome: disconnected.error.context.outcome,
    mutation: prepared.state,
    viewRead: read.result.outcome.result,
    readinessTimeout: timeout.state,
  }
}

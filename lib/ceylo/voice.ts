export type VoicePhase="idle"|"requesting"|"listening"|"finishing"|"speaking";
export type Recognition={
  lang:string;continuous:boolean;interimResults:boolean;
  onstart:(()=>void)|null;onend:(()=>void)|null;
  onerror:((event:{error:string})=>void)|null;
  onresult:((event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;
  start:()=>void;stop:()=>void;abort:()=>void;
};
export type VoiceDependencies={
  recognition?:()=>Recognition;
  speak?:(text:string,onEnd:()=>void,onError:()=>void)=>void;
  cancelSpeech:()=>void;
};
type Callbacks={phase:(value:VoicePhase)=>void;transcript:(value:string)=>void;error:(value:string)=>void};
const errors:Record<string,string>={
  "not-allowed":"Microphone permission was denied. Allow it in your browser settings, or type your question.",
  "service-not-allowed":"This browser's speech service is unavailable. Please type your question.",
  "audio-capture":"No microphone is available. Please check your device or type your question.",
  "no-speech":"No speech was detected. Try again, or type your question.",
  network:"The browser speech service could not connect. Please type your question.",
  "language-not-supported":"English recognition is unavailable in this browser. Please type your question."
};

/** User-initiated only. Generation guards discard callbacks after cancellation. */
export function createVoiceController(deps:VoiceDependencies,callbacks:Callbacks){
  let recognition:Recognition|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  let generation=0,disposed=false;
  const clear=()=>{if(timer)clearTimeout(timer);timer=undefined};
  const cancel=()=>{
    generation++;clear();
    if(recognition){const old=recognition;recognition=undefined;old.onstart=old.onend=old.onerror=old.onresult=null;try{old.abort()}catch{}}
    deps.cancelSpeech();
    if(!disposed)callbacks.phase("idle");
  };
  return {
    canRecognize:Boolean(deps.recognition),canSpeak:Boolean(deps.speak),
    start(){
      if(disposed)return;
      cancel();callbacks.error("");
      if(!deps.recognition){callbacks.error("Voice input is not supported here. Please type your question.");return}
      const current=++generation,active=()=>!disposed&&generation===current;
      try{
        const next=deps.recognition();recognition=next;
        next.lang="en-US";next.continuous=false;next.interimResults=true;
        next.onstart=()=>{if(active()){clear();callbacks.phase("listening");timer=setTimeout(()=>{if(active()){cancel();callbacks.error("Listening timed out. Please try a shorter question or type it.")}},60_000)}};
        next.onresult=event=>{if(active())callbacks.transcript(Array.from(event.results,result=>result[0]?.transcript??"").join(" ").trim().slice(0,600))};
        next.onend=()=>{if(active()){clear();recognition=undefined;callbacks.phase("idle")}};
        next.onerror=event=>{if(active()){cancel();if(event.error!=="aborted")callbacks.error(errors[event.error]??"Speech recognition failed. Please try again or type your question.")}};
        callbacks.phase("requesting");
        timer=setTimeout(()=>{if(active()){cancel();callbacks.error("The microphone did not start. Check browser permissions or type your question.")}},15_000);
        next.start();
      }catch{cancel();callbacks.error("The microphone could not start. Please type your question.")}
    },
    stopListening(){
      if(disposed||!recognition)return;
      callbacks.phase("finishing");clear();
      const current=generation;
      try{recognition.stop()}catch{cancel();return}
      if(recognition&&generation===current)timer=setTimeout(()=>{if(generation===current)cancel()},1500);
    },
    speak(text:string){
      if(disposed)return;
      cancel();callbacks.error("");
      if(!deps.speak){callbacks.error("Spoken replies are unavailable here. The complete answer is shown in the chat.");return}
      const current=++generation,active=()=>!disposed&&generation===current;
      callbacks.phase("speaking");
      timer=setTimeout(()=>{if(active()){cancel();callbacks.error("Speech playback stopped. You can read the complete answer in the chat.")}},180_000);
      try{deps.speak(text.slice(0,2400),()=>{if(active()){clear();callbacks.phase("idle")}},()=>{if(active()){cancel();callbacks.error("The browser could not speak this reply. The complete answer is shown in the chat.")}})}catch{cancel();callbacks.error("Speech playback is unavailable. Please read the reply.")}
    },
    cancel,
    destroy(){disposed=true;cancel()}
  };
}

export function browserVoiceDependencies():VoiceDependencies{
  const scope=window as Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
  const Constructor=scope.SpeechRecognition??scope.webkitSpeechRecognition;
  const synthesis=window.speechSynthesis;
  return {
    ...(Constructor?{recognition:()=>new Constructor()}:{}),
    ...(synthesis&&window.SpeechSynthesisUtterance?{speak:(text:string,onEnd:()=>void,onError:()=>void)=>{
      const utterance=new SpeechSynthesisUtterance(text);
      utterance.lang="en-US";utterance.rate=.95;
      const english=synthesis.getVoices().filter(voice=>/^en(?:-|_)/i.test(voice.lang));
      utterance.voice=english.find(voice=>voice.default)??english[0]??null;
      utterance.onend=onEnd;utterance.onerror=onError;synthesis.speak(utterance);
    }}:{}),
    cancelSpeech:()=>synthesis?.cancel()
  };
}

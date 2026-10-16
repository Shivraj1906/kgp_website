const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/hero-video.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/media.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'data/content.json'), 'utf8'));
for (const asset of manifest.assets) {
  assert.match(asset.source, /^https:\/\//); assert.ok(asset.authors); assert.match(asset.licenseUrl, /^https:\/\/creativecommons.org\//);
  for (const file of asset.files) {
    const bytes = fs.readFileSync(path.join(root, file));
    assert.ok(bytes.length > 1000);
    if (file.endsWith('.jpg')) assert.equal(bytes.subarray(0,2).toString('hex'), 'ffd8');
    else assert.equal(bytes.subarray(4,8).toString(), 'ftyp');
  }
}
for (const area of data.research) for (const project of area.projects || []) {
  assert.ok(manifest.assets.some(asset => asset.files.includes(project.illustration)));
  assert.ok(project.imageAlt && project.imageCaption && project.imageCredit && project.imageLicenseUrl && project.imageSource);
}
(async () => {
  for (const scenario of ['normal','reduced','saveData','blocked']) {
    const events = {}, videoEvents = {};
    const toggle = {hidden: true, addEventListener: (event, fn) => {events['button:'+event] = fn;}};
    const video = {paused: true, dataset: {src:'assets/video/cell-culture.mp4'},
      getAttribute(name) {return this[name];}, removeAttribute(name) {delete this[name];}, load() {},
      addEventListener: (event, fn) => {videoEvents[event]=fn;},
      pause() {this.paused=true; videoEvents.pause?.();},
      async play() {if(scenario==='blocked') throw Error('Autoplay denied'); this.paused=false;videoEvents.play?.();}
    };
    const document = {hidden:false,querySelector: selector => selector==='#hero-video'?video:toggle,addEventListener: (event,fn)=>{events[event]=fn;}};
    const window = {matchMedia:()=>({matches:scenario==='reduced',addEventListener:(_,fn)=>{events.motion=fn;}}),addEventListener:(event,fn)=>{events[event]=fn;},IntersectionObserver:true};
    class Observer {constructor(fn){events.intersection=fn;} observe(){}}
    vm.runInNewContext(script,{window,document,navigator:{connection:{saveData:scenario==='saveData'}},IntersectionObserver:Observer});
    window.initHeroVideo(); await new Promise(setImmediate); await new Promise(setImmediate);
    assert.equal(toggle.hidden,false);
    assert.equal(video.paused,scenario!=='normal');
    if (scenario==='reduced'||scenario==='saveData') {
      assert.equal(video.src,undefined,'do not fetch automatically');
      events['button:click'](); await new Promise(setImmediate); assert.equal(video.paused,false);
    }
    if(scenario==='blocked'){assert.equal(toggle.textContent,'Play video');continue;}
    events.intersection([{isIntersecting:false}]); assert.equal(video.paused,true);
    events.intersection([{isIntersecting:true}]); await new Promise(setImmediate); assert.equal(video.paused,false);
    events['button:click'](); assert.equal(video.paused,true);
    events.intersection([{isIntersecting:true}]); assert.equal(video.paused,true,'manual pause persists');
    events['button:click'](); await new Promise(setImmediate);
    document.hidden=true;events.visibilitychange();assert.equal(video.paused,true);
    document.hidden=false;events.visibilitychange();await new Promise(setImmediate);assert.equal(video.paused,false);
    events.motion();assert.equal(video.paused,true);
    videoEvents.error();assert.equal(toggle.disabled,true);assert.equal(video.src,undefined);
  }
  console.log('PASS media signatures, attribution, playback, reduced motion, data saving, autoplay rejection, offscreen/hidden suspension, persistent pause and error fallback');
})().catch(error=>{console.error(error);process.exitCode=1;});

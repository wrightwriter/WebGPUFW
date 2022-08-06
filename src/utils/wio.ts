import { Matrix4, Vector3 } from "@0b5vr/experimental";
import { mat4, vec3 } from "gl-matrix";
import { Sketch } from "index";
import { max, Vec, Vec3 } from "./wmath";


interface keyState{
  down: boolean
}

type BtnCode = 'KeyA' | 'KeyB' | 'KeyC' | 'KeyD' | 'KeyE' | 'KeyF' | 'KeyG' | 'KeyH' | 'KeyI' | 'KeyJ' | 'KeyK' | 'KeyL' | 'KeyM' | 'KeyN' | 'KeyO' | 'KeyP' | 'KeyQ' | 'KeyR' | 'KeyS' | 'KeyT' | 'KeyU' | 'KeyI' | 'KeyV' | 'KeyW' | 'KeyX' | 'KeyY' | 'KeyZ' | 
  'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'Digit9' | 'Digit0' |
  'ControlLeft' | 'AltLeft' | 'ShiftLeft' | 'Space' 


type MouseType = {x: number; y: number; down: boolean; click: boolean; xNdc: number; yNdc: number}

export class IO {
  private keys = new Map<BtnCode, keyState>()
  mousePrevFrame: MouseType  = {x: 0, y: 0, down: false, click: false, xNdc: 0, yNdc: 0,}
  mouse: MouseType = {x: 0, y: 0, down: false, click: false, xNdc: 0, yNdc: 0,}
  deltaMouseNdc = new Vec(0,0)


  private mouseState: MouseType = {x: 0, y: 0, down: false, click: false, xNdc: 0, yNdc: 0}

  private pointerLocked = false

  // 🔧 
  constructor(){

    window.addEventListener('keydown', (ev) => {
      this.keys[ev.code] = {down:true}
    })

    window.addEventListener('keyup', (ev) => {
      this.keys[ev.code] = {down:false}
      // console.log(this.keys)
    })

    window.addEventListener("pointermove", (e) => {

      if(this.pointerLocked){
        this.mouseState.x += e.movementX; this.mouseState.y += e.movementY
        this.mouseState.xNdc = (this.mouseState.x / Sketch.wgpu.width) * 2 - 1; this.mouse.yNdc = -(this.mouseState.y / Sketch.wgpu.height) * 2 + 1;

      } else{
        this.mouseState.x = e.clientX; this.mouseState.y = e.clientY
        this.mouseState.xNdc = (e.clientX / Sketch.wgpu.width) * 2 - 1; this.mouse.yNdc = -(e.clientY / Sketch.wgpu.height) * 2 + 1;
      }
    })
    // window.addEventListener("mousedown", () => {
    //   // this.mouseState.click = !this.mouse.down
    // })
    window.addEventListener("mousedown", async () => {
      this.mouseState.down = true
      this.mouseState.click = true
      if(Sketch.camera.pilot){
        // if(!this.mouseState.click)
        this.pointerLocked = true
        await Sketch.wgpu.canvas.requestPointerLock()
      }
    })

    window.addEventListener("mouseup", (e) => {
      this.mouseState.down = false
      // this.mouseState.click = false

      if(Sketch.camera.pilot){
        document.exitPointerLock()
      }
    })


      document.addEventListener('pointerlockchange', ()=>{}, false);

  }
  // ♻ 
  public async update(){


    // Switch mouse and mousePrevFrame
    const tempMouse = this.mousePrevFrame
    this.mousePrevFrame = this.mouse
    this.mouse = tempMouse

    // Copy mouse state to curr mouse.
    for(let [key, value] of Object.entries(this.mouseState)){
      this.mouse[key] = value 
    }

    // this.deltaMouseNdc.v[0] = (this.mouse.x - this.mousePrevFrame.x)/Sketch.wgpu.width
    // this.deltaMouseNdc.v[1] = (this.mouse.y - this.mousePrevFrame.y)/Sketch.wgpu.height
    this.deltaMouseNdc.v[0] = (this.mouse.x - this.mousePrevFrame.x)
    this.deltaMouseNdc.v[1] = (this.mouse.y - this.mousePrevFrame.y)







    this.mouseState.click = false

    // if(this.mouse.click && !this.pointerLocked){
    //   this.pointerLocked = true

    // } else {
      // if(this.pointerLocked)
      //   document.exitPointerLock();
 
      // this.pointerLocked = false
    // }


    // if(this.getKeyDown("ControlLeft") && this.pointerLocked === false){
    //   // @ts-ignore
    //   if(this.pointerLocked === true){
    //     console.log(this.pointerLocked)
    //     console.log("trig mouselock")
    //   }
    //   this.pointerLocked = true
    //   await Sketch.wgpu.canvas.requestPointerLock()
    //   document.addEventListener('pointerlockchange', ()=>{}, false);

    // } else {
    //   if(this.pointerLocked)
    //     document.exitPointerLock();
 
    //   this.pointerLocked = false
    // }
  }
  public getKeyDown(code: BtnCode): boolean{
    try {
      return this.keys[code].down
    } catch (ignore) {
      return false
    }
  }

}
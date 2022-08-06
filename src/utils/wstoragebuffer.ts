
import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"
import {Vec, Vec3, Vec4} from "./wmath"
import { Matrix4, Vector, Vector3, Vector4 } from "@0b5vr/experimental"

export class StorageBuffer {
  public _buff: GPUBuffer
  protected type: GPUBufferBindingType
  public mappedArr?: Float32Array | Int32Array
  protected totalFloatSz: number = 0

  public get buff(): GPUBuffer{
    return this._buff
  }

  public create(
    size: number = 1400, 
    usage: number = GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC, 
    array?: Float32Array | Int32Array,
    mapped = false,
    uniform = false,
  ): StorageBuffer{
    this.type = uniform ? "uniform" : "storage"

    // if(mapped || array){
      if(array){
        if(array instanceof Float32Array){
          this.mappedArr = new Float32Array(array.length)
          this.mappedArr.set(array)
        } else if (array instanceof Int32Array){
          this.mappedArr = new Int32Array(array.length)
          this.mappedArr.set(array)
        }
      } else this.mappedArr = new Float32Array(size)
    // }

    this.totalFloatSz = size

    this._buff = Sketch.wgpu.device.createBuffer({
      mappedAtCreation: true, size: size*4 , usage,
    })

    let arrayBuffer: ArrayBuffer = this._buff.getMappedRange()

    // this.mappedArr.forEach((val, idx)=>{
    //   this.mappedArr[idx] = idx % 2 === 0 ? 0. : 1.
    // })
    // if(this.mappedArr)
    new Float32Array(arrayBuffer).set(this.mappedArr)

    this._buff.unmap()


    // const buffer: GPUBuffer = Sketch.wgpu.device.createBuffer({
    //   mappedAtCreation: true,
    //   size: ((bufferDataArray.byteLength + 3) & ~3), // bruh, this rounds to ceil of repd of 4
    //   usage: GPUBufferUsage.VERTEX
    // })
    
    // const arrayBuffer: ArrayBuffer = buffer.getMappedRange()

    // new Float32Array(arrayBuffer).set(bufferDataArray)
    
    // buffer.unmap()    


    return this
  }

  public uploadMapped(){
    Sketch.wgpu.queue.writeBuffer(
      this.buff,0,
      // this.mappedArr.buffer,0, padding
      this.mappedArr.buffer,0, this.mappedArr.buffer.byteLength
    )
  }

  public clear(
    endLastPass: boolean = true,
    offset?: number,
    size?: number,
    ){
    offset = ifExistsAElseB(offset, 0)
    size = ifExistsAElseB( this.mappedArr.buffer.byteLength, 0)

    if(endLastPass){
      Sketch.wgpu.flushPasses()
    }

    const commandEncoder = Sketch.wgpu.device.createCommandEncoder()

    Sketch.wgpu.encoderPasses.push({
      commandEncoder: commandEncoder,
    })
    commandEncoder.clearBuffer(this.buff, offset, size)
  }

  constructor(){


  }
}
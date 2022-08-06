
type BindGroupElement = Texture | UniformBuffer

import { Sketch } from "index"
import { Texture } from "./wtexture"
import { UniformBuffer } from "./wuniformbuffer"
import { StorageBuffer } from "./wstoragebuffer"

export class BindGroup{
  private _bindGroup: GPUBindGroup
  private _bindGroupLayout: GPUBindGroupLayout

  public get bindGroupLayout(){
    return this._bindGroupLayout
  }
  public get bindGroup(){
    return this._bindGroup
  }

  elements: BindGroupElement[]= []

  // ♻ 
  rebuild(){
    const bindGroupEntries: GPUBindGroupEntry[] = []
    const bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []

    let i = 0
    for(let element of this.elements){
      if(element instanceof Texture){

      } else if (element instanceof StorageBuffer){
        bindGroupEntries.push({
          binding: i,
          resource: {
            buffer: element.buff
          }
        })
        bindGroupLayoutEntries.push({
          binding: i,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
          buffer: {
            type: element instanceof UniformBuffer ?  "uniform" : "storage"
          }
        })
      }
      i++
    }

    this._bindGroupLayout =  Sketch.wgpu.device.createBindGroupLayout({
        entries: bindGroupLayoutEntries
      })

    this._bindGroup = Sketch.wgpu.device.createBindGroup({
      layout: this._bindGroupLayout,
      entries: bindGroupEntries
    })
  }

  // 🔧 
  constructor( groups: BindGroupElement[]){
    this.elements = groups

    this.rebuild()
  }

}
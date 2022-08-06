
import { Sketch } from "index"
import { UniformBuffer } from "./wuniformbuffer"
import { StorageBuffer } from "./wstoragebuffer"
import { Texture } from "./wtexture"
import { BindGroup } from "./wbindgroup"
import { Thing } from "./wthing"
import { ComputeProgram } from "./wcompute"



type UniformWriable = StorageBuffer | Texture

export abstract class AbstractBindingContainer {
  protected bindGroups: GPUBindGroup[] = [Sketch.sharedUBO.bindGroup, Sketch.sharedUBO.bindGroup, Sketch.sharedUBO.bindGroup, Sketch.sharedUBO.bindGroup]
  protected bindGroupLayouts: GPUBindGroupLayout[] = [Sketch.sharedUBO.bindGroupLayout, Sketch.sharedUBO.bindGroupLayout, Sketch.sharedUBO.bindGroupLayout, Sketch.sharedUBO.bindGroupLayout]

  // protected uniformTextures: Map<Texture, number> = new Map<Texture,number>()
  protected uniformTextures: {[key: number]:Texture} = {}
  protected uniformBuffers: UniformBuffer[]
  protected uniformWritables: {[key: number]:UniformWriable} = {}

  protected pipeline: GPURenderPipeline | GPUComputePipeline
  protected pipelineDescriptor: GPURenderPipelineDescriptor | GPUComputePipelineDescriptor

  protected pipelineNeedsRefresh: boolean = false

  // 🔧 
  constructor(){

    let i = 0
    for(let bindGroup of this.bindGroups){
      this.bindGroups[i] = Sketch.sharedBindGroup.bindGroup
      this.bindGroupLayouts[i] = Sketch.sharedBindGroup.bindGroupLayout
      i++
    }
  }


  // 💼 
  private refreshWritable(){
    let bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
    let bindGroupEntries: GPUBindGroupEntry[] = []

    for(let [idx, writableObj] of Object.entries(this.uniformWritables)){
      if(writableObj instanceof StorageBuffer){
        bindGroupLayoutEntries.push({
          binding: parseInt(idx),
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
          buffer:{
            type: "storage"
          }
        })
        bindGroupEntries.push( {
          binding: parseInt(idx),
          resource: {
            buffer: writableObj.buff,
            size: writableObj.mappedArr.byteLength,
            offset: 0
          }
        })

      } else if (writableObj instanceof Texture){
        bindGroupLayoutEntries.push({
          binding: parseInt(idx),
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT,
          storageTexture: {
            format: writableObj.props.format,
            access: "write-only"
          }
        })
        bindGroupEntries.push({
          binding: parseInt(idx),
          resource: writableObj.view
        })

      }
    }

    this.bindGroupLayouts[3] = Sketch.wgpu.device.createBindGroupLayout({
      entries: bindGroupLayoutEntries
    })

    this.bindGroups[3] = Sketch.wgpu.device.createBindGroup({
      layout: this.bindGroupLayouts[3],
      entries: bindGroupEntries
    })

    // this.refreshPipeline()
    this.pipelineNeedsRefresh = true
  }

  // 💼 
  public setWritable(thing: UniformWriable, idx: number){
    this.uniformWritables[idx] = thing 
    this.refreshWritable()
  }

  // 💼 
  public setWritables(storageBuffers: UniformWriable[]){
    let i = 0
    for(let buff of storageBuffers){
      this.uniformWritables[i] = buff
      i++
    }
    this.refreshWritable()
  }
  // size: uniformBuffer.mappedArr.byteLength,
  // offset: 0

  // 🦄 
  public setUbos(uniformBuffers: UniformBuffer[]){
    this.uniformBuffers = uniformBuffers

    let bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
    let bindGroupEntries: GPUBindGroupEntry[] = []

    let i = 0
    for(let uniformBuffer of uniformBuffers){
      bindGroupLayoutEntries.push({
        binding: i, 
        visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        buffer: {
          type: "uniform"
        }
      })
      bindGroupEntries.push( {
        binding: i,
        resource: {
          buffer: uniformBuffer.buff,
        }
      })
      i++
    }

    this.bindGroupLayouts[1] = Sketch.wgpu.device.createBindGroupLayout({
      entries: bindGroupLayoutEntries
    })

    this.bindGroups[1] = Sketch.wgpu.device.createBindGroup({
      layout: this.bindGroupLayouts[1],
      entries: bindGroupEntries
    })

    this.pipelineNeedsRefresh = true
  }


  // ♻ 
  protected refreshPipeline(){
    this.pipelineDescriptor.layout = Sketch.wgpu.device.createPipelineLayout({
      bindGroupLayouts: this.bindGroupLayouts
    })

    // if(this.pipeline instanceof GPURenderPipeline){
    if((this.pipelineDescriptor as GPURenderPipelineDescriptor).vertex){
      this.pipeline = Sketch.wgpu.device.createRenderPipeline(this.pipelineDescriptor as GPURenderPipelineDescriptor)
    } else if((this.pipelineDescriptor as GPUComputePipelineDescriptor).compute){
      this.pipeline = Sketch.wgpu.device.createComputePipeline(this.pipelineDescriptor as GPUComputePipelineDescriptor)
    } else {
      throw "uuuh"
    }
    this.pipelineNeedsRefresh = false
  }

  // 🖼️
  public setTexture(texture: Texture, idx: number){
    this.uniformTextures[idx] = texture
    this.refreshTextures()
  }

  // 🖼️
  public setTextures(uniformTextures: Texture[]){
    let i = 1
    for(let texture of uniformTextures){
      this.uniformTextures[i] = texture
      i++
    }
    this.refreshTextures()
  }


  // ♻ 
  private refreshTextures(){
    // this.uniformTextures = uniformTextures
    let bindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
    let bindGroupEntries: GPUBindGroupEntry[] = []

    const sampler = Sketch.wgpu.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
    })

    bindGroupEntries.push({
      binding: 0,
      resource: sampler
    })
    bindGroupLayoutEntries.push({
      binding: 0,
      visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
      sampler: {
        type: "filtering"
      }
    })

    for(let [idx, tex] of Object.entries(this.uniformTextures)){
      bindGroupLayoutEntries.push({
        binding: parseInt(idx),
        visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
        texture: {
          sampleType: "float", 
        },
      })
      bindGroupEntries.push({
        binding: parseInt(idx),
        resource: tex.view
      })
    }
    this.bindGroupLayouts[2] = Sketch.wgpu.device.createBindGroupLayout({
      entries: bindGroupLayoutEntries
    })
    this.bindGroups[2] = Sketch.wgpu.device.createBindGroup({
      layout: this.bindGroupLayouts[2],
      entries: bindGroupEntries
    })

    // this.refreshPipeline()
    this.pipelineNeedsRefresh = true
  }

}
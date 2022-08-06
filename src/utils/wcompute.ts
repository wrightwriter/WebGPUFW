import { ifExistsAElseB, loop } from "./utils"
import { Sketch } from "index"

import { FrameBuffer } from "./wframebuffer"
import { Texture } from "./wtexture"
import { AbstractBindingContainer } from "./wabstractbindingcontainer"
import { ShaderCompute, ShaderImports } from "./wgpu"
import { Vector3 } from "@0b5vr/experimental"
import { StorageBuffer } from "./wstoragebuffer"


type ComputeBuffer = Texture

// 🔢 
export class ComputeProgram extends AbstractBindingContainer{
  protected override pipeline!: GPUComputePipeline
  protected override pipelineDescriptor: GPUComputePipelineDescriptor

  private computePassDescriptor: GPUComputePassDescriptor
  private computeShader: ShaderCompute 

  private commandEncoder: GPUCommandEncoder
  private passEncoder: GPUComputePassEncoder

  private boundBuffer: ComputeBuffer

  constructor({compString, buffer}:{compString: string, buffer?: ComputeBuffer}){
    super()

    this.computeShader = new ShaderCompute(compString)


    this.pipelineDescriptor = {
      compute: {
        module: this.computeShader.compModule,
        entryPoint: "main"
      }
    }
    // this.pipeline = Sketch.wgpu.device.createComputePipeline(this.pipelineDescriptor)
    this.pipelineNeedsRefresh = true

    this.boundBuffer = buffer

    if(this.boundBuffer){
      this.setBuffer(this.boundBuffer)
    }

    this.computePassDescriptor = { }
  }
  setBuffer(buffer: ComputeBuffer){
    this.boundBuffer = buffer
    if(buffer instanceof Texture){
      this.setWritable(buffer, 9)
    } 

  }

  runBound({endLastPass}:{endLastPass?: boolean}){
    if(process.env.DEV){
      if(!this.boundBuffer)
        throw "Pls gib me buffer"
    }

    if(this.boundBuffer instanceof Texture){
      this.runTex({endLastPass,texture: this.boundBuffer})
    }
  }

  runTex({endLastPass, texture}:{endLastPass?: boolean; texture: Texture}){
    const workGroupSz = new Vector3([ Math.ceil(texture.width/16), Math.ceil(texture.height/16), 1])

    this.runSz({endLastPass,workGroupSz})
  }

  runBuffer({endLastPass, buffer}:{endLastPass?: boolean; buffer: StorageBuffer}){
    const workGroupSz = new Vector3([ Math.ceil(buffer.mappedArr.length / 256) ,1 , 1 ])

    this.runSz({endLastPass,workGroupSz})
  }

  runSz( {endLastPass, workGroupSz}:{endLastPass?: boolean; workGroupSz: Vector3}){
    endLastPass = ifExistsAElseB(endLastPass, true)

    if(endLastPass){
      Sketch.wgpu.flushPasses()
    }

    if(this.pipelineNeedsRefresh){
      this.refreshPipeline()
    }

    this.commandEncoder = Sketch.wgpu.device.createCommandEncoder()
    this.passEncoder = this.commandEncoder.beginComputePass(this.computePassDescriptor)

    Sketch.wgpu.encoderPasses.push({
      commandEncoder: this.commandEncoder,
      passEncoder: this.passEncoder,
    })

    let i = 0
    for(let bindGroup of this.bindGroups){
      this.passEncoder.setBindGroup(i, bindGroup)
      i++
    }

    this.passEncoder.setPipeline(this.pipeline)
    // this.passEncoder.dispatch(workGroupSz.x, workGroupSz.y, workGroupSz.z)
    // @ts-ignore
    this.passEncoder.dispatchWorkgroups(workGroupSz.x, workGroupSz.y, workGroupSz.z)

  }

}
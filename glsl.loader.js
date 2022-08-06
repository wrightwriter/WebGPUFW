const path = require("path")
const fs = require("fs")
const cmd = require("node-cmd")

module.exports = function(source){
  const filename = path.basename(this.resourcePath) // path of source
  let log = this.resourcePath + ` 
  `
  return cmd.runSync("pwd").data

  // const outputFilePath = this.resourcePath.replace(".frag",".wgsl").replace(".vert",".wgsl").replace(".glsl",".wgsl")
  // const syncDir = cmd.runSync(`cd ./naga & cargo run ` 
  //   + this.resourcePath + ` `
  //   + outputFilePath
  // )

  // log += `
  //       Sync Err ${syncDir.err}
        
  //       Sync stderr:  ${syncDir.stderr}

  //       Sync Data ${syncDir.data}
  //   `

  // if(syncDir.err){
  //   throw "Error: " + syncDir.err
  // } else {
  //   const assetInfo = {sourceFilename: filename}
  //   const shaderWgslString = fs.readFileSync(outputFilePath)
  //   this.emitFile(filename, shaderWgslString, null, assetInfo)
  //   return shaderWgslString
  // }


  // return this.resourcePath
}


// module.exports.raw = true
import NodeCache from "node-cache";

let storage
export default function () {
  if (!storage) {
    storage = new NodeCache({ 
      stdTTL: 60 * 60, 
      useClones: false 
    })
  }
  return storage
} 
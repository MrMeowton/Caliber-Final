import { Motor, Coupling, CentrifugalPump, GateValve, Tank } from './industrial'
import { Box, Cylinder, Gltf } from './generic'

// Registry bentuk bawaan. Di config, part.shape merujuk ke kunci di sini.
// Tambah bentuk sendiri lewat prop `shapes` pada <Asset3DView> / <AssetCanvas>
// tanpa mengubah file ini:  shapes={{ reactor: MyReactor }}
export const BUILTIN_SHAPES = {
  motor: Motor,
  coupling: Coupling,
  pump: CentrifugalPump,
  valve: GateValve,
  tank: Tank,
  box: Box,
  cylinder: Cylinder,
  gltf: Gltf,
}

export { useSpin } from './useSpin'

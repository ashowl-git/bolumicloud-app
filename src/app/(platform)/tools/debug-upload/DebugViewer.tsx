'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface DebugViewerProps {
  sceneUrl: string
  onLog: (msg: string) => void
}

function ModelLoader({ url, onLog }: { url: string; onLog: (msg: string) => void }) {
  const { camera, scene: threeScene } = useThree()
  const groupRef = useRef<THREE.Group | null>(null)
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  useEffect(() => {
    const log = (msg: string) => onLogRef.current(msg)
    log(`[3D] GLTFLoader.load 시작: ${url}`)

    // Cleanup previous model
    if (groupRef.current) {
      threeScene.remove(groupRef.current)
      groupRef.current = null
    }

    const group = new THREE.Group()
    const loader = new GLTFLoader()

    loader.load(
      url,
      (gltf) => {
        log(`[3D] GLB 로드 성공!`)

        const loaded = gltf.scene
        log(`[3D] children: ${loaded.children.length}`)

        // SketchUp OBJ → trimesh GLB는 Y-up이므로 회전 불필요
        log(`[3D] Y-up 좌표계 (회전 없음)`)

        // Compute normals
        let meshCount = 0
        loaded.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount++
            child.geometry.computeVertexNormals()
            child.material = new THREE.MeshStandardMaterial({
              color: '#7CB9E8',
              roughness: 0.7,
              metalness: 0.1,
              side: THREE.DoubleSide,
            })
          }
        })
        log(`[3D] 메시 개수: ${meshCount}`)

        group.add(loaded)

        // Bounding box
        const box = new THREE.Box3().setFromObject(group)
        const center = new THREE.Vector3()
        const size = new THREE.Vector3()
        box.getCenter(center)
        box.getSize(size)
        log(`[3D] BBox center: (${center.x.toFixed(1)}, ${center.y.toFixed(1)}, ${center.z.toFixed(1)})`)
        log(`[3D] BBox size: (${size.x.toFixed(1)}, ${size.y.toFixed(1)}, ${size.z.toFixed(1)})`)

        // Center model
        group.position.set(-center.x, -box.min.y, -center.z)
        group.updateMatrixWorld(true)

        // Recompute bbox after centering
        const box2 = new THREE.Box3().setFromObject(group)
        const center2 = new THREE.Vector3()
        const size2 = new THREE.Vector3()
        box2.getCenter(center2)
        box2.getSize(size2)
        log(`[3D] 센터링 후 center: (${center2.x.toFixed(1)}, ${center2.y.toFixed(1)}, ${center2.z.toFixed(1)})`)

        // Camera setup
        const maxDim = Math.max(size2.x, size2.y, size2.z)
        const dist = maxDim * 2
        camera.near = Math.max(0.1, maxDim * 0.001)
        camera.far = Math.max(10000, maxDim * 10)
        camera.position.set(dist, dist * 0.7, dist)
        camera.lookAt(center2.x, center2.y, center2.z)
        ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
        log(`[3D] 카메라: dist=${dist.toFixed(1)}, near=${camera.near.toFixed(2)}, far=${camera.far.toFixed(0)}`)

        threeScene.add(group)
        groupRef.current = group
        log(`[3D] 씬에 모델 추가 완료`)
      },
      (progress) => {
        if (progress.total > 0) {
          log(`[3D] 로딩: ${((progress.loaded / progress.total) * 100).toFixed(0)}%`)
        }
      },
      (error) => {
        log(`[3D] GLB 로드 실패: ${error}`)
      }
    )

    return () => {
      if (groupRef.current) {
        threeScene.remove(groupRef.current)
        groupRef.current = null
      }
    }
  }, [url, camera, threeScene])

  return null
}

export default function DebugViewer({ sceneUrl, onLog }: DebugViewerProps) {
  const [mounted, setMounted] = useState(false)
  const onLogRef = useRef(onLog)
  onLogRef.current = onLog

  useEffect(() => {
    onLogRef.current('[3D] Canvas 마운트')
    setMounted(true)
  }, [])

  return (
    <Canvas
      camera={{ position: [20, 15, 20], fov: 50, near: 0.1, far: 50000 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor('#f0f0f0')
        gl.toneMapping = 0
        onLogRef.current('[3D] WebGL context 생성 완료')
      }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 80, 30]} intensity={0.8} />
      <hemisphereLight args={['#87ceeb', '#f5f5f0', 0.3]} />

      <Suspense fallback={null}>
        {mounted && <ModelLoader url={sceneUrl} onLog={onLog} />}
      </Suspense>

      <OrbitControls enableDamping dampingFactor={0.1} />

      {/* Ground grid */}
      <gridHelper args={[100, 20, '#cccccc', '#e5e5e5']} />
    </Canvas>
  )
}

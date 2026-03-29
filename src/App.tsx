import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Float, MeshTransmissionMaterial, Text, Stars, GradientTexture, RoundedBox } from '@react-three/drei'
import { useRef, useState, Suspense, useMemo } from 'react'
import * as THREE from 'three'

// Animated gear component
function Gear({ position, scale = 1, speed = 1, teeth = 12, color = '#00d4ff' }: {
  position: [number, number, number],
  scale?: number,
  speed?: number,
  teeth?: number,
  color?: string
}) {
  const ref = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    ref.current.rotation.z += delta * speed
  })

  const gearShape = useMemo(() => {
    const shape = new THREE.Shape()
    const innerRadius = 0.3
    const outerRadius = 0.5
    const toothHeight = 0.15

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2
      const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2
      const afterAngle = ((i + 1) / teeth) * Math.PI * 2

      if (i === 0) {
        shape.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius)
      }
      shape.lineTo(Math.cos(angle) * (outerRadius + toothHeight), Math.sin(angle) * (outerRadius + toothHeight))
      shape.lineTo(Math.cos(nextAngle) * (outerRadius + toothHeight), Math.sin(nextAngle) * (outerRadius + toothHeight))
      shape.lineTo(Math.cos(nextAngle) * outerRadius, Math.sin(nextAngle) * outerRadius)
      shape.lineTo(Math.cos(afterAngle) * outerRadius, Math.sin(afterAngle) * outerRadius)
    }
    shape.closePath()

    // Inner hole
    const hole = new THREE.Path()
    hole.absellipse(0, 0, innerRadius, innerRadius, 0, Math.PI * 2, true, 0)
    shape.holes.push(hole)

    return shape
  }, [teeth])

  const extrudeSettings = { depth: 0.15, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[gearShape, extrudeSettings]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Wireframe cube with animation
function WireframeCube({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    ref.current.rotation.y = state.clock.elapsedTime * 0.3
  })

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color={hovered ? '#ff6b35' : '#00d4ff'} wireframe />
    </mesh>
  )
}

// Floating particles
function Particles({ count = 200 }) {
  const ref = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 20
      pos[i + 1] = (Math.random() - 0.5) * 20
      pos[i + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [count])

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#00d4ff" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

// Central holographic model
function HolographicModel() {
  const groupRef = useRef<THREE.Group>(null!)
  const [active, setActive] = useState(false)

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group
        ref={groupRef}
        onClick={() => setActive(!active)}
        scale={active ? 1.2 : 1}
      >
        {/* Main body */}
        <mesh castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <MeshTransmissionMaterial
            backside
            samples={16}
            resolution={512}
            transmission={0.9}
            roughness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.1}
            thickness={0.5}
            chromaticAberration={0.5}
            anisotropy={0.5}
            color="#00d4ff"
          />
        </mesh>

        {/* Inner core */}
        <mesh scale={0.3}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={2} />
        </mesh>

        {/* Orbiting ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </Float>
  )
}

// Grid floor
function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[50, 50, 50, 50]} />
      <meshStandardMaterial
        color="#0a1628"
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

// Axis lines
function AxisLines() {
  return (
    <group position={[0, -2, 0]}>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([-10, 0, 0, 10, 0, 0])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff3366" transparent opacity={0.5} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([0, 0, -10, 0, 0, 10])}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#33ff66" transparent opacity={0.5} />
      </line>
    </group>
  )
}

// Blueprint text
function BlueprintLabel() {
  return (
    <Text
      position={[0, 2.5, 0]}
      fontSize={0.3}
      color="#00d4ff"
      anchorX="center"
      anchorY="middle"
      font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff"
    >
      AI MODEL GENERATOR v1.1
    </Text>
  )
}

// Scene content
function Scene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 3, -5]} intensity={0.5} color="#ff6b35" />
      <pointLight position={[5, 3, 5]} intensity={0.5} color="#00d4ff" />

      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

      <Suspense fallback={null}>
        <HolographicModel />
        <BlueprintLabel />
      </Suspense>

      <Gear position={[-3, 0.5, -1]} scale={1.5} speed={0.5} teeth={16} color="#1a3a5c" />
      <Gear position={[-2.2, 0.5, -1]} scale={1} speed={-0.75} teeth={10} color="#2a5a8c" />
      <Gear position={[3, -0.5, 0]} scale={1.2} speed={0.4} teeth={14} color="#1a3a5c" />

      <WireframeCube position={[2.5, 1, -2]} />

      <Float speed={1.5} floatIntensity={0.3}>
        <RoundedBox args={[0.6, 0.6, 0.6]} radius={0.05} position={[-2, 1.5, 1]}>
          <meshStandardMaterial color="#ff6b35" metalness={0.8} roughness={0.2} />
        </RoundedBox>
      </Float>

      <Float speed={2} floatIntensity={0.4}>
        <mesh position={[2, 2, 1]}>
          <octahedronGeometry args={[0.4]} />
          <meshStandardMaterial color="#00d4ff" metalness={0.9} roughness={0.1} />
        </mesh>
      </Float>

      <Particles count={300} />
      <GridFloor />
      <AxisLines />

      <Environment preset="night" />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={15}
        enablePan={false}
      />
    </>
  )
}

// UI Panel component
function UIPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/10 ${className}`}>
      {children}
    </div>
  )
}

// File upload button
function FileButton({ icon, label, accept, formats }: { icon: string, label: string, accept: string, formats: string }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <label
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input type="file" accept={accept} className="hidden" />
      <div className={`
        flex items-center gap-3 px-4 py-3
        bg-gradient-to-r from-slate-800/90 to-slate-900/90
        border border-cyan-500/20 rounded-lg
        transition-all duration-300 ease-out
        hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20
        hover:translate-x-1
        ${isHovered ? 'bg-cyan-500/10' : ''}
      `}>
        <span className="text-2xl">{icon}</span>
        <div className="flex flex-col">
          <span className="text-cyan-100 font-medium text-sm">{label}</span>
          <span className="text-cyan-500/60 text-xs font-mono">{formats}</span>
        </div>
        <div className={`
          ml-auto w-2 h-2 rounded-full transition-all duration-300
          ${isHovered ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-cyan-500/30'}
        `} />
      </div>
    </label>
  )
}

// Feature card
function FeatureCard({ icon, title, description }: { icon: string, title: string, description: string }) {
  return (
    <div className="group p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 hover:bg-slate-800/80">
      <div className="flex items-start gap-3">
        <span className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
        <div>
          <h4 className="text-cyan-100 text-sm font-semibold mb-1">{title}</h4>
          <p className="text-slate-400 text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

// Main App
export default function App() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleGenerate = () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 3000)
  }

  return (
    <div className="w-screen h-screen bg-slate-950 overflow-hidden relative" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#030810']} />
        <fog attach="fog" args={['#030810', 8, 25]} />
        <Scene />
      </Canvas>

      {/* Top header bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-cyan-100 text-lg md:text-xl font-bold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                FreeCAD AI
              </h1>
              <p className="text-cyan-500/60 text-xs">Plugin v1.1</p>
            </div>
          </div>

          {/* Desktop status indicators */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs">AI Ready</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/50">
              <span className="text-slate-400 text-xs">GPU:</span>
              <span className="text-cyan-400 text-xs font-semibold">CUDA</span>
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg bg-slate-800/60 border border-slate-700/50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Left panel - Desktop */}
      <div className="hidden lg:block absolute left-4 top-24 bottom-20 w-80">
        <UIPanel className="h-full p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
            <span className="text-orange-400">⚡</span>
            <h2 className="text-cyan-100 font-semibold">Генератор моделей</h2>
          </div>

          {/* Prompt input */}
          <div className="mb-4">
            <label className="text-slate-400 text-xs mb-2 block uppercase tracking-wider">Описание модели</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите 3D модель, которую хотите создать..."
              className="w-full h-24 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-cyan-100 text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wider
              transition-all duration-300 mb-6
              ${isGenerating
                ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
                : prompt.trim()
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02]'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Генерация...
              </span>
            ) : (
              '🚀 Создать модель'
            )}
          </button>

          {/* File uploads */}
          <div className="flex-1 overflow-y-auto">
            <label className="text-slate-400 text-xs mb-3 block uppercase tracking-wider">Загрузить файл</label>
            <div className="space-y-2">
              <FileButton icon="🖼️" label="Изображение" accept="image/*" formats=".png, .jpg, .webp" />
              <FileButton icon="📐" label="STL модель" accept=".stl" formats=".stl" />
              <FileButton icon="🔧" label="STEP файл" accept=".step,.stp" formats=".step, .stp" />
              <FileButton icon="📦" label="3MF архив" accept=".3mf" formats=".3mf" />
            </div>
          </div>

          {/* Features */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <label className="text-slate-400 text-xs mb-3 block uppercase tracking-wider">Возможности</label>
            <div className="space-y-2">
              <FeatureCard
                icon="🧠"
                title="ИИ генерация"
                description="Создание 3D моделей из текстового описания"
              />
              <FeatureCard
                icon="🔄"
                title="Конвертация"
                description="Преобразование между форматами STL, STEP, 3MF"
              />
            </div>
          </div>
        </UIPanel>
      </div>

      {/* Right panel - Desktop */}
      <div className="hidden lg:block absolute right-4 top-24 w-72">
        <UIPanel className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
            <span className="text-cyan-400">📊</span>
            <h2 className="text-cyan-100 font-semibold">Параметры</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs mb-2 block">Детализация</label>
              <input
                type="range"
                min="1"
                max="10"
                defaultValue="7"
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Низкая</span>
                <span>Высокая</span>
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-xs mb-2 block">Формат экспорта</label>
              <select className="w-full px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-cyan-100 text-sm focus:outline-none focus:border-cyan-500/50">
                <option>STEP (.step)</option>
                <option>STL (.stl)</option>
                <option>3MF (.3mf)</option>
                <option>OBJ (.obj)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-xs mb-2 block">Единицы измерения</label>
              <div className="flex gap-2">
                {['mm', 'cm', 'inch'].map((unit) => (
                  <button
                    key={unit}
                    className="flex-1 py-2 px-3 bg-slate-800/60 border border-slate-600/50 rounded-lg text-cyan-100 text-sm hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all uppercase"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </UIPanel>

        {/* Quick stats */}
        <UIPanel className="p-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-slate-800/40 rounded-lg">
              <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>2.4K</div>
              <div className="text-slate-500 text-xs">Вершин</div>
            </div>
            <div className="text-center p-3 bg-slate-800/40 rounded-lg">
              <div className="text-2xl font-bold text-orange-400" style={{ fontFamily: "'Orbitron', sans-serif" }}>1.2K</div>
              <div className="text-slate-500 text-xs">Полигонов</div>
            </div>
          </div>
        </UIPanel>
      </div>

      {/* Mobile slide-out panel */}
      <div className={`
        lg:hidden fixed inset-0 z-50 transition-all duration-300
        ${mobileMenuOpen ? 'visible' : 'invisible'}
      `}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Panel */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-900/95 backdrop-blur-xl
          border-r border-cyan-500/20 p-4 overflow-y-auto
          transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-cyan-100 font-semibold text-lg" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              Панель управления
            </h2>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-800/60"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile prompt input */}
          <div className="mb-4">
            <label className="text-slate-400 text-xs mb-2 block uppercase tracking-wider">Описание модели</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Опишите 3D модель..."
              className="w-full h-24 px-3 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-cyan-100 text-sm placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <button
            onClick={() => { handleGenerate(); setMobileMenuOpen(false); }}
            disabled={isGenerating || !prompt.trim()}
            className={`
              w-full py-3 px-4 rounded-lg font-semibold text-sm uppercase tracking-wider mb-6
              ${prompt.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-500'}
            `}
          >
            🚀 Создать модель
          </button>

          {/* Mobile file uploads */}
          <label className="text-slate-400 text-xs mb-3 block uppercase tracking-wider">Загрузить файл</label>
          <div className="space-y-2 mb-6">
            <FileButton icon="🖼️" label="Изображение" accept="image/*" formats=".png, .jpg, .webp" />
            <FileButton icon="📐" label="STL модель" accept=".stl" formats=".stl" />
            <FileButton icon="🔧" label="STEP файл" accept=".step,.stp" formats=".step, .stp" />
            <FileButton icon="📦" label="3MF архив" accept=".3mf" formats=".3mf" />
          </div>

          {/* Mobile features */}
          <label className="text-slate-400 text-xs mb-3 block uppercase tracking-wider">Возможности</label>
          <div className="space-y-2">
            <FeatureCard
              icon="🧠"
              title="ИИ генерация"
              description="Создание 3D моделей из текстового описания"
            />
            <FeatureCard
              icon="🔄"
              title="Конвертация"
              description="Преобразование между форматами"
            />
          </div>
        </div>
      </div>

      {/* Bottom floating action - Mobile */}
      <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-white font-semibold shadow-lg shadow-cyan-500/40 flex items-center gap-2"
        >
          <span>⚡</span>
          <span>Генератор</span>
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3 flex items-center justify-center">
        <p className="text-slate-600 text-xs font-mono">
          Requested by @web-user · Built by @clonkbot
        </p>
      </div>

      {/* Scanline effect overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />
    </div>
  )
}

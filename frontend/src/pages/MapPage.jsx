import { useState, useEffect } from 'react'
import { apiService } from '../lib/api'

export default function MapPage() {
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyBusinesses, setNearbyBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [distanceFilter, setDistanceFilter] = useState(5)
  const [map, setMap] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('checking')

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    console.log('🚀 Inicializando página do mapa...')
    setLoading(true)
    setConnectionStatus('checking')
    
    try {
      // Verificar conectividade
      await apiService.initialize()
      const isOnline = apiService.isOnline()
      setConnectionStatus(isOnline ? 'online' : 'offline')
      
      console.log(`📡 Status de conectividade: ${isOnline ? 'Online' : 'Offline'}`)
      
      // Carregar Google Maps
      loadGoogleMaps()
      
      // Verificar permissão de localização
      checkLocationPermission()
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error)
      setError('Erro na inicialização da página')
      setConnectionStatus('offline')
    }
  }

  const loadGoogleMaps = () => {
    console.log('🗺️ Carregando Google Maps...')
    
    // Verificar se já foi carregado
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps já carregado')
      return
    }

    // Remover script existente
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      existingScript.remove()
      console.log('🗑️ Script anterior removido')
    }

    // Criar novo script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`
    script.async = true
    script.defer = true
    
    // Função global de callback
    window.initGoogleMaps = () => {
      console.log('✅ Google Maps carregado via callback')
      setError('') // Limpar erros anteriores
    }
    
    script.onload = () => {
      console.log('✅ Script Google Maps carregado')
    }
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar Google Maps')
      setError('Google Maps indisponível. Usando mapa alternativo.')
    }
    
    document.head.appendChild(script)
    console.log('📜 Script Google Maps adicionado')
  }

  const checkLocationPermission = () => {
    console.log('📍 Verificando permissão de localização...')
    
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador')
      useExampleLocation()
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        
        console.log(`✅ Localização obtida: ${location.latitude}, ${location.longitude}`)
        setUserLocation(location)
        loadNearbyBusinesses(location)
        initializeMap(location)
      },
      (error) => {
        console.error('❌ Erro de geolocalização:', error)
        setError('Não foi possível obter sua localização. Usando localização de exemplo.')
        useExampleLocation()
      },
      options
    )
  }

  const useExampleLocation = () => {
    const exampleLocation = {
      latitude: -23.4336,
      longitude: -45.0838,
      accuracy: 100
    }
    
    console.log('🔧 Usando localização de exemplo: Ubatuba, SP')
    setUserLocation(exampleLocation)
    loadNearbyBusinesses(exampleLocation)
    initializeMap(exampleLocation)
  }

  const loadNearbyBusinesses = async (location) => {
    console.log('🔍 Carregando estabelecimentos próximos...')
    
    try {
      const response = await apiService.getNearbyBusinesses(
        location.latitude, 
        location.longitude, 
        distanceFilter
      )
      
      const businesses = response.data || []
      console.log(`✅ ${businesses.length} estabelecimentos encontrados`)
      setNearbyBusinesses(businesses)
      
      // Adicionar marcadores no mapa se disponível
      if (map && businesses.length > 0) {
        addBusinessMarkers(businesses, map)
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar estabelecimentos:', error)
      setError('Erro ao carregar estabelecimentos próximos')
    } finally {
      setLoading(false)
    }
  }

  const initializeMap = (location) => {
    console.log('🗺️ Inicializando mapa...', location)
    
    if (!window.google || !window.google.maps) {
      console.log('❌ Google Maps não disponível, usando mapa alternativo')
      initializeFallbackMap(location)
      return
    }

    const mapElement = document.getElementById('google-map')
    if (!mapElement) {
      console.error('❌ Elemento do mapa não encontrado')
      return
    }

    try {
      const mapOptions = {
        center: { lat: location.latitude, lng: location.longitude },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }

      console.log('🗺️ Criando mapa Google Maps...')
      const newMap = new window.google.maps.Map(mapElement, mapOptions)
      setMap(newMap)

      // Adicionar marcador do usuário
      const userMarker = new window.google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: newMap,
        title: 'Sua localização',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      })

      // Adicionar círculo de raio
      const circle = new window.google.maps.Circle({
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#3B82F6',
        fillOpacity: 0.1,
        map: newMap,
        center: { lat: location.latitude, lng: location.longitude },
        radius: distanceFilter * 1000
      })

      console.log('✅ Mapa Google Maps criado com sucesso')
      
      // Adicionar marcadores dos estabelecimentos
      if (nearbyBusinesses.length > 0) {
        addBusinessMarkers(nearbyBusinesses, newMap)
      }

    } catch (error) {
      console.error('❌ Erro ao criar mapa Google Maps:', error)
      initializeFallbackMap(location)
    }
  }

  const initializeFallbackMap = (location) => {
    console.log('🗺️ Inicializando mapa alternativo...')
    const mapElement = document.getElementById('google-map')
    if (!mapElement) return

    mapElement.innerHTML = `
      <div class="h-full w-full bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="grid grid-cols-8 grid-rows-6 h-full w-full">
            ${Array(48).fill(0).map(() => '<div class="border border-gray-300"></div>').join('')}
          </div>
        </div>
        <div class="text-center z-10 bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-md">
          <div class="text-4xl mb-4">🗺️</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Mapa de Localização</h3>
          <p class="text-sm text-gray-600 mb-4">
            📍 Localização: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
          </p>
          <div class="flex items-center justify-center space-x-4 text-sm mb-4">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span>Você</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Estabelecimentos</span>
            </div>
          </div>
          <p class="text-xs text-gray-500">
            ${nearbyBusinesses.length} estabelecimentos em ${distanceFilter}km
          </p>
          <div class="mt-4 text-xs text-orange-600">
            Google Maps indisponível - Usando mapa alternativo
          </div>
        </div>
      </div>
    `
    console.log('✅ Mapa alternativo criado')
  }

  const addBusinessMarkers = (businesses, mapInstance) => {
    if (!mapInstance || !window.google) return

    businesses.forEach(business => {
      if (!business.latitude || !business.longitude) return

      const marker = new window.google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map: mapInstance,
        title: business.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#10B981" stroke="white" stroke-width="3"/>
              <text x="16" y="20" text-anchor="middle" fill="white" font-size="16">🏪</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 max-w-xs">
            <h3 class="font-semibold text-gray-900 mb-1">${business.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${business.description || ''}</p>
            <p class="text-xs text-gray-500 mb-3">${business.address || ''}</p>
            <div class="flex space-x-2">
              <a href="https://wa.me/55${business.phone?.replace(/\D/g, '')}" 
                 target="_blank" 
                 class="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600">
                WhatsApp
              </a>
              <a href="https://maps.google.com/dir/?api=1&destination=${business.latitude},${business.longitude}" 
                 target="_blank" 
                 class="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                Direções
              </a>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker)
      })
    })

    console.log(`✅ ${businesses.length} marcadores adicionados ao mapa`)
  }

  const handleDistanceChange = (newDistance) => {
    setDistanceFilter(newDistance)
    if (userLocation) {
      loadNearbyBusinesses(userLocation)
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return 'text-green-600'
      case 'offline': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'Conectado'
      case 'offline': return 'Modo Offline'
      default: return 'Verificando...'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🗺️ Mapa de Localização
          </h1>
          <p className="text-gray-600">
            Encontre estabelecimentos próximos à sua localização
          </p>
          <div className={`text-sm mt-2 ${getConnectionStatusColor()}`}>
            📡 {getConnectionStatusText()}
          </div>
        </div>

        {/* Aviso de Conectividade */}
        {connectionStatus === 'offline' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-orange-500 mr-3">⚠️</div>
              <div>
                <h3 className="text-orange-800 font-semibold">Aviso de Conectividade</h3>
                <p className="text-orange-700 text-sm">
                  {error || 'Erro ao carregar dados: Failed to fetch'}
                </p>
                <p className="text-orange-600 text-sm mt-1">
                  Exibindo dados em modo offline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                Raio de busca:
              </label>
              <select
                value={distanceFilter}
                onChange={(e) => handleDistanceChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={0.5}>500m</option>
                <option value={1}>1km</option>
                <option value={2}>2km</option>
                <option value={5}>5km</option>
                <option value={10}>10km</option>
              </select>
            </div>
            
            {userLocation && (
              <div className="text-sm text-gray-600">
                📍 {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                {userLocation.accuracy && (
                  <span className="ml-2 text-xs">
                    (±{userLocation.accuracy.toFixed(0)}m)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando mapa e estabelecimentos...</p>
          </div>
        )}

        {/* Google Maps */}
        {userLocation && !loading && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                🗺️ Mapa de Localização
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({nearbyBusinesses.length} estabelecimentos em {distanceFilter}km)
                </span>
              </h2>
            </div>
            <div 
              id="google-map" 
              className="h-96 w-full"
              style={{ minHeight: '400px' }}
            ></div>
          </div>
        )}

        {/* Lista de Estabelecimentos Próximos */}
        {nearbyBusinesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                🏪 Estabelecimentos Próximos ({nearbyBusinesses.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {nearbyBusinesses.map((business) => (
                <div key={business.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {business.name}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {business.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <span className="mr-1">{business.category?.icon || '🏪'}</span>
                          {business.category?.name || 'Categoria'}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {business.city?.name}, {business.city?.state}
                        </span>
                        {business.distance && (
                          <span className="flex items-center">
                            <span className="mr-1">📏</span>
                            {business.distance.toFixed(1)}km
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {business.address}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      <a
                        href={`https://wa.me/55${business.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors text-center"
                      >
                        💬 WhatsApp
                      </a>
                      <a
                        href={`https://maps.google.com/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors text-center"
                      >
                        🧭 Direções
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nenhum estabelecimento encontrado */}
        {!loading && nearbyBusinesses.length === 0 && userLocation && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum estabelecimento encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Não encontramos estabelecimentos em um raio de {distanceFilter}km da sua localização.
            </p>
            <button
              onClick={() => handleDistanceChange(distanceFilter * 2)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Expandir busca para {distanceFilter * 2}km
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


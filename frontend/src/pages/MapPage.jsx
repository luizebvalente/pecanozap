import { useState, useEffect } from 'react'

function MapPage({ onNavigate }) {
  const [userLocation, setUserLocation] = useState(null)
  const [nearbyBusinesses, setNearbyBusinesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [distanceFilter, setDistanceFilter] = useState(5) // km
  const [locationPermission, setLocationPermission] = useState('prompt')
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    checkLocationPermission()
    loadGoogleMaps()
  }, [])

  const loadGoogleMaps = () => {
    // Verificar se o Google Maps já foi carregado
    if (window.google && window.google.maps) {
      return
    }

    // Criar script do Google Maps
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dOWTgaN2KKlqDo&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = () => {
      console.log('✅ Google Maps carregado')
    }
    
    script.onerror = () => {
      console.error('❌ Erro ao carregar Google Maps')
      setError('Erro ao carregar Google Maps. Verifique sua conexão.')
    }
    
    document.head.appendChild(script)
  }

  const checkLocationPermission = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não é suportada neste navegador')
      return
    }
    
    // Verificar permissão
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state)
      })
    }
  }

  const initializeMap = (location) => {
    if (!window.google || !window.google.maps) {
      console.error('Google Maps não carregado')
      return
    }

    const mapElement = document.getElementById('google-map')
    if (!mapElement) return

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
      radius: distanceFilter * 1000 // converter km para metros
    })

    return newMap
  }

  const addBusinessMarkers = (businesses, mapInstance) => {
    if (!mapInstance || !window.google) return

    // Limpar marcadores existentes
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])

    const newMarkers = []

    businesses.forEach((business, index) => {
      if (!business.latitude || !business.longitude) return

      const marker = new window.google.maps.Marker({
        position: { lat: business.latitude, lng: business.longitude },
        map: mapInstance,
        title: business.business_name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 18 10 18s10-10 10-18c0-5.52-4.48-10-10-10z" fill="#10B981" stroke="white" stroke-width="2"/>
              <circle cx="16" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 32)
        }
      })

      // Adicionar InfoWindow
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${business.business_name}</h3>
            <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${business.category?.name || 'Categoria'}</p>
            <p style="margin: 0 0 8px 0; color: #666; font-size: 12px;">📍 ${business.address || 'Endereço não informado'}</p>
            <p style="margin: 0 0 8px 0; color: #10B981; font-size: 12px; font-weight: bold;">📏 ${business.distance}km de distância</p>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.openWhatsApp('${business.whatsapp}', '${business.business_name}')" 
                      style="background: #25D366; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                💬 WhatsApp
              </button>
              <button onclick="window.openDirections(${business.latitude}, ${business.longitude})" 
                      style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                🧭 Direções
              </button>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker)
      })

      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
  }

  const getCurrentLocation = () => {
    setLoading(true)
    setError('')

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutos
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
        setUserLocation(location)
        
        // Inicializar mapa
        const mapInstance = initializeMap(location)
        
        // Buscar estabelecimentos próximos
        findNearbyBusinesses(location, mapInstance)
      },
      (error) => {
        setLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Permissão de localização negada. Por favor, permita o acesso à localização.')
            break
          case error.POSITION_UNAVAILABLE:
            setError('Localização indisponível. Verifique se o GPS está ativado.')
            break
          case error.TIMEOUT:
            setError('Tempo limite excedido. Tente novamente.')
            break
          default:
            setError('Erro desconhecido ao obter localização.')
            break
        }
      },
      options
    )
  }

  const findNearbyBusinesses = async (location, mapInstance = map) => {
    try {
      console.log('🔍 Buscando estabelecimentos próximos...')
      
      // Múltiplas URLs para tentar
      const urls = [
        'https://pecanozap-production.up.railway.app/api/businesses/nearby',
        'http://localhost:5000/api/businesses/nearby'
      ]
      
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        radius: distanceFilter.toString()
      })
      
      let response = null
      let lastError = null
      
      for (const baseUrl of urls) {
        try {
          const fullUrl = `${baseUrl}?${params}`
          console.log(`🌐 Tentando API: ${fullUrl}`)
          
          response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            mode: 'cors',
            credentials: 'omit'
          })
          
          if (response.ok) {
            console.log(`✅ Sucesso na API: ${baseUrl}`)
            break
          }
        } catch (err) {
          console.error(`❌ Erro na API ${baseUrl}:`, err)
          lastError = err
          continue
        }
      }
      
      if (response && response.ok) {
        const data = await response.json()
        console.log('📊 Estabelecimentos encontrados:', data.businesses.length)
        
        setNearbyBusinesses(data.businesses)
        
        // Adicionar marcadores no mapa
        if (mapInstance) {
          addBusinessMarkers(data.businesses, mapInstance)
        }
      } else {
        throw lastError || new Error(`Erro HTTP: ${response?.status}`)
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error)
      
      // Fallback com dados mock para desenvolvimento
      const mockBusinesses = [
        {
          id: 1,
          business_name: 'Pizzaria do João',
          category: { name: 'Restaurantes' },
          address: 'Rua das Flores, 123',
          latitude: location.latitude + 0.001,
          longitude: location.longitude + 0.001,
          distance: 0.2,
          whatsapp: '11999999999',
          rating: 4.8
        },
        {
          id: 2,
          business_name: 'Farmácia Central',
          category: { name: 'Farmácias' },
          address: 'Av. Principal, 456',
          latitude: location.latitude - 0.002,
          longitude: location.longitude + 0.002,
          distance: 0.5,
          whatsapp: '11888888888',
          rating: 4.9
        }
      ]
      
      console.log('🔧 Usando dados mock para desenvolvimento')
      setNearbyBusinesses(mockBusinesses)
      
      if (mapInstance) {
        addBusinessMarkers(mockBusinesses, mapInstance)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDistanceFilterChange = (newDistance) => {
    setDistanceFilter(newDistance)
    if (userLocation) {
      findNearbyBusinesses(userLocation)
    }
  }

  const handleWhatsAppClick = (business) => {
    const cleanPhone = business.whatsapp.replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const message = `Olá! Vi o ${business.business_name} no Peça no Zap e estou próximo ao local. Gostaria de mais informações.`
    const encodedMessage = encodeURIComponent(message)
    const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`
    window.open(url, '_blank')
  }

  const openInMaps = (business) => {
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${business.latitude},${business.longitude}`
    window.open(url, '_blank')
  }

  // Funções globais para InfoWindow
  useEffect(() => {
    window.openWhatsApp = (whatsapp, businessName) => {
      const cleanPhone = whatsapp.replace(/\D/g, '')
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
      const message = `Olá! Vi o ${businessName} no Peça no Zap e estou próximo ao local. Gostaria de mais informações.`
      const encodedMessage = encodeURIComponent(message)
      const url = `https://wa.me/${fullPhone}?text=${encodedMessage}`
      window.open(url, '_blank')
    }

    window.openDirections = (lat, lng) => {
      if (userLocation) {
        const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lng}`
        window.open(url, '_blank')
      }
    }

    return () => {
      delete window.openWhatsApp
      delete window.openDirections
    }
  }, [userLocation])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🗺️ Encontrar no Mapa
              </h1>
              <p className="text-gray-600 mt-1">
                Descubra estabelecimentos próximos à sua localização
              </p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={getCurrentLocation}
                disabled={loading}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>📍</span>
                <span>{loading ? 'Localizando...' : 'Usar Minha Localização'}</span>
              </button>

              {userLocation && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Localização:</span> 
                  <span className="ml-1">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            {userLocation && (
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">
                  Distância máxima:
                </label>
                <select
                  value={distanceFilter}
                  onChange={(e) => handleDistanceFilterChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={0.5}>500m</option>
                  <option value={1}>1km</option>
                  <option value={2}>2km</option>
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Buscando estabelecimentos próximos...</p>
          </div>
        )}

        {/* Google Maps */}
        {userLocation && !loading && (
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div 
              id="google-map" 
              className="h-96 w-full rounded-lg"
              style={{ minHeight: '400px' }}
            ></div>
          </div>
        )}

        {/* Lista de Estabelecimentos Próximos */}
        {nearbyBusinesses.length > 0 && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Estabelecimentos Próximos ({nearbyBusinesses.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {nearbyBusinesses.map((business) => (
                <div key={business.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {business.business_name}
                        </h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {business.distance}km
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600 space-x-2 mb-2">
                        <span>{business.category?.name || business.category}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1">{business.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        📍 {business.address}
                      </p>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleWhatsAppClick(business)}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm flex items-center space-x-1"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </button>
                        
                        <button
                          onClick={() => openInMaps(business)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm flex items-center space-x-1"
                        >
                          <span>🧭</span>
                          <span>Como Chegar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!userLocation && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Encontre estabelecimentos próximos
            </h3>
            <p className="text-gray-600 mb-6">
              Permita o acesso à sua localização para descobrir os melhores negócios da região
            </p>
            <button
              onClick={getCurrentLocation}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 flex items-center space-x-2 mx-auto"
            >
              <span>📍</span>
              <span>Usar Minha Localização</span>
            </button>
          </div>
        )}

        {/* Nenhum estabelecimento encontrado */}
        {userLocation && nearbyBusinesses.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum estabelecimento encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Não encontramos estabelecimentos em um raio de {distanceFilter}km da sua localização
            </p>
            <div className="space-x-4">
              <button
                onClick={() => handleDistanceFilterChange(10)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Aumentar Raio para 10km
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                Cadastrar Estabelecimento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapPage


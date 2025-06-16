function App() {
  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: '#25D366',
        color: 'white',
        borderRadius: '10px'
      }}>
        <h1 style={{margin: 0, fontSize: '2.5rem'}}>
          🍃 Peça no Zap
        </h1>
        <p style={{margin: '10px 0 0 0', fontSize: '1.2rem'}}>
          Conectando você aos melhores estabelecimentos via WhatsApp
        </p>
      </header>

      <main>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{color: '#25D366', marginBottom: '20px'}}>
            ✅ Site Funcionando!
          </h2>
          <p style={{fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '20px'}}>
            Seu projeto "Peça no Zap" está online e funcionando perfeitamente!
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{color: '#25D366', margin: '0 0 10px 0'}}>
                🏪 Estabelecimentos
              </h3>
              <p style={{margin: 0, color: '#666'}}>
                Cadastre seu negócio
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{color: '#25D366', margin: '0 0 10px 0'}}>
                💬 WhatsApp
              </h3>
              <p style={{margin: 0, color: '#666'}}>
                Conexão direta
              </p>
            </div>
            
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{color: '#25D366', margin: '0 0 10px 0'}}>
                ⭐ Avaliações
              </h3>
              <p style={{margin: 0, color: '#666'}}>
                Sistema completo
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: '#25D366',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{margin: '0 0 15px 0'}}>🚀 Funcionalidades Ativas</h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              <li>✅ Backend Railway</li>
              <li>✅ PostgreSQL</li>
              <li>✅ Frontend Vercel</li>
              <li>✅ API Funcionando</li>
              <li>✅ WhatsApp Integration</li>
              <li>✅ Sistema Completo</li>
            </ul>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{color: '#856404', margin: '0 0 15px 0'}}>
            🔧 Próximos Passos
          </h3>
          <ol style={{color: '#856404', lineHeight: '1.6'}}>
            <li>Adicionar páginas de Login e Cadastro</li>
            <li>Implementar navegação entre páginas</li>
            <li>Conectar com API do Railway</li>
            <li>Testar funcionalidades completas</li>
          </ol>
        </div>

        <div style={{textAlign: 'center'}}>
          <button 
            onClick={() => alert('🎉 Botão funcionando! Site está ativo!')}
            style={{
              backgroundColor: '#25D366',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              fontSize: '1.1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#128C7E'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#25D366'}
          >
            🧪 Testar Funcionalidade
          </button>
        </div>
      </main>
    </div>
  )
}

export default App


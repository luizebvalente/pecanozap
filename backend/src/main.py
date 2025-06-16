import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

app = Flask(__name__)

# Configurações
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# CORREÇÃO AUTOMÁTICA DA URL DO POSTGRESQL
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Corrigir URL do PostgreSQL automaticamente
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    print(f"🗄️ Conectando com PostgreSQL...")
    print(f"🔗 URL: {database_url[:30]}...")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'
    print(f"🗄️ Usando SQLite local...")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações adicionais para PostgreSQL
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {
        'connect_timeout': 10,
        'sslmode': 'require'
    } if database_url else {}
}

# Inicializar extensões
try:
    db = SQLAlchemy(app)
    print("✅ SQLAlchemy inicializado")
except Exception as e:
    print(f"❌ Erro ao inicializar SQLAlchemy: {e}")

# Configurar CORS
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS(app, origins=cors_origins)

# Modelos de dados
class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    businesses = db.relationship('User', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'business_count': len(self.businesses)
        }

class City(db.Model):
    __tablename__ = 'cities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    businesses = db.relationship('User', backref='city', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'business_count': len(self.businesses)
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(200), nullable=False)
    owner_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    whatsapp = db.Column(db.String(20))
    address = db.Column(db.Text)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Chaves estrangeiras
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    
    # Relacionamentos
    reviews = db.relationship('Review', backref='business', lazy=True)
    
    @property
    def rating(self):
        if not self.reviews:
            return 0
        return sum(review.rating for review in self.reviews) / len(self.reviews)
    
    @property
    def review_count(self):
        return len(self.reviews)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'business_name': self.business_name,
            'owner_name': self.owner_name,
            'phone': self.phone,
            'whatsapp': self.whatsapp,
            'address': self.address,
            'description': self.description,
            'is_active': self.is_active,
            'city_id': self.city_id,
            'category_id': self.category_id,
            'city': self.city.to_dict() if self.city else None,
            'category': self.category.to_dict() if self.category else None,
            'rating': round(self.rating, 1),
            'review_count': self.review_count,
            'created_at': self.created_at.isoformat()
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120))
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Chaves estrangeiras
    business_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'rating': self.rating,
            'comment': self.comment,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }

# Rotas de Health Check e Debug
@app.route('/')
def health_check():
    try:
        # Testar conexão com banco
        db.session.execute('SELECT 1')
        db_status = "connected"
        db_type = "PostgreSQL" if database_url else "SQLite"
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_type = "unknown"
    
    return jsonify({
        'status': 'healthy',
        'message': 'Peça no Zap API funcionando!',
        'database': {
            'status': db_status,
            'type': db_type
        },
        'version': '1.0.0',
        'endpoints': [
            '/api/categories',
            '/api/cities',
            '/api/businesses',
            '/api/register',
            '/api/login',
            '/api/test-db'
        ]
    }), 200

@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/test-db')
def test_database():
    try:
        # Testar criação de tabelas
        db.create_all()
        print("✅ Tabelas verificadas/criadas")
        
        # Testar query
        categories = Category.query.all()
        cities = City.query.all()
        users = User.query.all()
        
        return jsonify({
            'status': 'success',
            'message': 'Banco conectado e funcionando!',
            'database_type': 'PostgreSQL' if database_url else 'SQLite',
            'tables': {
                'categories': len(categories),
                'cities': len(cities),
                'users': len(users)
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'database_url_exists': bool(os.environ.get('DATABASE_URL'))
        }), 500

@app.route('/api/debug-connection')
def debug_connection():
    try:
        import psycopg2
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return jsonify({
                'status': 'error',
                'message': 'DATABASE_URL não configurada'
            }), 400
        
        # Corrigir URL se necessário
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        # Testar conexão direta
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'postgresql_version': version[0],
            'connection': 'direct_connection_ok'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'database_url_format': database_url[:30] + '...' if database_url else 'not_set'
        }), 500

# Rotas da API
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([category.to_dict() for category in categories]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cities', methods=['GET'])
def get_cities():
    try:
        cities = City.query.all()
        return jsonify([city.to_dict() for city in cities]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/businesses', methods=['GET'])
def get_businesses():
    try:
        # Filtros
        city_id = request.args.get('city_id')
        category_id = request.args.get('category_id')
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))
        
        # Query base
        query = User.query.filter_by(is_active=True)
        
        # Aplicar filtros
        if city_id:
            query = query.filter_by(city_id=city_id)
        if category_id:
            query = query.filter_by(category_id=category_id)
        if search:
            query = query.filter(
                db.or_(
                    User.business_name.contains(search),
                    User.description.contains(search)
                )
            )
        
        # Paginação
        businesses = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'businesses': [business.to_dict() for business in businesses.items],
            'total': businesses.total,
            'pages': businesses.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Outras rotas...
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['email', 'password', 'business_name', 'owner_name', 'city_id', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo usuário
        user = User(
            email=data['email'],
            business_name=data['business_name'],
            owner_name=data['owner_name'],
            phone=data.get('phone', ''),
            whatsapp=data.get('whatsapp', ''),
            address=data.get('address', ''),
            description=data.get('description', ''),
            city_id=data['city_id'],
            category_id=data['category_id']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Estabelecimento cadastrado com sucesso!',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_initial_data():
    """Criar dados iniciais"""
    try:
        print("🔄 Verificando dados iniciais...")
        
        # Categorias
        if Category.query.count() == 0:
            print("📊 Criando categorias...")
            categories_data = [
                {'name': 'Restaurantes', 'description': 'Restaurantes e lanchonetes', 'icon': 'utensils'},
                {'name': 'Farmácias', 'description': 'Farmácias e drogarias', 'icon': 'pill'},
                {'name': 'Supermercados', 'description': 'Supermercados e mercearias', 'icon': 'shopping-cart'},
                {'name': 'Beleza', 'description': 'Salões de beleza e estética', 'icon': 'scissors'},
                {'name': 'Saúde', 'description': 'Clínicas e consultórios', 'icon': 'heart'},
                {'name': 'Educação', 'description': 'Escolas e cursos', 'icon': 'book'},
                {'name': 'Serviços', 'description': 'Prestadores de serviços', 'icon': 'wrench'},
                {'name': 'Comércio', 'description': 'Lojas e comércio em geral', 'icon': 'store'}
            ]
            
            for cat_data in categories_data:
                category = Category(**cat_data)
                db.session.add(category)
            
            print(f"✅ {len(categories_data)} categorias criadas")
        
        # Cidades
        if City.query.count() == 0:
            print("🏙️ Criando cidades...")
            cities_data = [
                {'name': 'São Paulo', 'state': 'SP'},
                {'name': 'Rio de Janeiro', 'state': 'RJ'},
                {'name': 'Belo Horizonte', 'state': 'MG'},
                {'name': 'Salvador', 'state': 'BA'},
                {'name': 'Brasília', 'state': 'DF'},
                {'name': 'Fortaleza', 'state': 'CE'},
                {'name': 'Recife', 'state': 'PE'},
                {'name': 'Porto Alegre', 'state': 'RS'},
                {'name': 'Curitiba', 'state': 'PR'},
                {'name': 'Goiânia', 'state': 'GO'}
            ]
            
            for city_data in cities_data:
                city = City(**city_data)
                db.session.add(city)
            
            print(f"✅ {len(cities_data)} cidades criadas")
        
        db.session.commit()
        print("✅ Dados iniciais verificados/criados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados iniciais: {e}")
        db.session.rollback()

if __name__ == '__main__':
    # Inicializar banco de dados
    with app.app_context():
        try:
            print("🔄 Inicializando banco de dados...")
            db.create_all()
            print("✅ Tabelas criadas/verificadas")
            
            create_initial_data()
            
        except Exception as e:
            print(f"❌ Erro na inicialização do banco: {e}")
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"🚀 Iniciando servidor na porta {port}")
    print(f"🌐 Modo debug: {debug_mode}")
    print(f"🗄️ Banco: {'PostgreSQL' if database_url else 'SQLite'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)


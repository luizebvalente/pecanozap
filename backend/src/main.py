import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.routes.user import user_bp, jwt

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'pecanozap_secret_key_2024'
app.config['JWT_SECRET_KEY'] = 'pecanozap_jwt_secret_2024'

# Configurar CORS para permitir requisições do frontend
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'])

# Configurar JWT
jwt.init_app(app)

app.register_blueprint(user_bp, url_prefix='/api')

# Configurar SQLite para desenvolvimento
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Função para popular dados iniciais
def populate_initial_data():
    """Popula dados iniciais no banco"""
    from src.models.user import Category, City
    
    # Categorias
    categories = [
        {'name': 'Restaurantes', 'description': 'Restaurantes e lanchonetes', 'icon': 'utensils'},
        {'name': 'Farmácias', 'description': 'Farmácias e drogarias', 'icon': 'pill'},
        {'name': 'Supermercados', 'description': 'Supermercados e mercearias', 'icon': 'shopping-cart'},
        {'name': 'Beleza', 'description': 'Salões de beleza e estética', 'icon': 'scissors'},
        {'name': 'Serviços', 'description': 'Serviços em geral', 'icon': 'wrench'},
        {'name': 'Roupas', 'description': 'Lojas de roupas e acessórios', 'icon': 'shirt'},
        {'name': 'Eletrônicos', 'description': 'Lojas de eletrônicos', 'icon': 'smartphone'},
        {'name': 'Saúde', 'description': 'Clínicas e consultórios', 'icon': 'heart-pulse'}
    ]
    
    for cat_data in categories:
        if not Category.query.filter_by(name=cat_data['name']).first():
            category = Category(**cat_data)
            db.session.add(category)
    
    # Cidades
    cities = [
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
    
    for city_data in cities:
        if not City.query.filter_by(name=city_data['name'], state=city_data['state']).first():
            city = City(**city_data)
            db.session.add(city)
    
    db.session.commit()

with app.app_context():
    db.create_all()
    populate_initial_data()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)

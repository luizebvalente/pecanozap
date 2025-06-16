from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    """Modelo para estabelecimentos/usuários"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(100), nullable=False)
    owner_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    whatsapp = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    
    # Relacionamentos reversos
    reviews = db.relationship('Review', backref='business', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Define a senha com hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verifica a senha"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Converte para dicionário"""
        return {
            'id': self.id,
            'email': self.email,
            'business_name': self.business_name,
            'owner_name': self.owner_name,
            'phone': self.phone,
            'whatsapp': self.whatsapp,
            'address': self.address,
            'description': self.description,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'city_id': self.city_id,
            'category_id': self.category_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'rating': self.get_average_rating(),
            'review_count': len(self.reviews)
        }
    
    def get_average_rating(self):
        """Calcula a média das avaliações"""
        if not self.reviews:
            return 0
        return sum(review.rating for review in self.reviews) / len(self.reviews)


class Category(db.Model):
    """Modelo para categorias de estabelecimentos"""
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  # Nome do ícone
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos reversos
    businesses = db.relationship('User', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'is_active': self.is_active,
            'business_count': len([b for b in self.businesses if b.is_active])
        }


class City(db.Model):
    """Modelo para cidades"""
    __tablename__ = 'cities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(2), nullable=False)  # UF
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos reversos
    businesses = db.relationship('User', backref='city', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'is_active': self.is_active,
            'business_count': len([b for b in self.businesses if b.is_active])
        }


class Review(db.Model):
    """Modelo para avaliações"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20))
    rating = db.Column(db.Integer, nullable=False)  # 1 a 5 estrelas
    comment = db.Column(db.Text)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    business_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'rating': self.rating,
            'comment': self.comment,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'business_id': self.business_id
        }



from flask import Flask, jsonify
from flask_cors import CORS, cross_origin
from flask import abort
from flask import make_response
from flask import request
from flask import url_for
from flask_httpauth import HTTPBasicAuth
auth = HTTPBasicAuth()

import mysql.connector
import subprocess
import os
import time
import math

app = Flask(__name__)
CORS(app)

def abre_mysql():
    cnx = mysql.connector.connect(
	user='smauser',
	password='smapassword',
	host='localhost',
	database='SmartMobileAnalyzer'
    )
    cr = cnx.cursor()
    return (cr,cnx)


def fecha_mysql(cr, cnx):
    cr.close()
    cnx.close()

class coleta:
	def __init__(self,_lat,_long,_data,_sinal,_opera,_tecno,_preci):
		self.latitude= _lat
		self.longitude= _long
		self.data= _data
		self.sinal= _sinal
		self.operadora= _opera
		self.tecnologia= _tecno
		self.precisao= _preci
	def enquadra_ponto(self): #Metodo que enquadra o ponto informado como parametro na lista de pontos
		enquadro = [math.floor((self.latitude-pontos[0][0][0])/R),math.floor((self.longitude-pontos[0][0][1])/R)]
		coord = [pontos[int(enquadro[0])][int(enquadro[1])][0]+R/2,pontos[int(enquadro[0])][int(enquadro[1])][1]+R/2]
		self.latitude = coord[0]
		self.longitude = coord[1]


###################################        COLETA        ###################################

@app.route('/coleta',methods=['POST'])
def recebe_coleta():
	if not request.json:
		abort(400)
	col = coleta(float(request.json['latitude']),float(request.json['longitude']),request.json['data'],int(request.json['sinal']),request.json['operadora'],request.json['tecnologia'],float(request.json['precisao']))
	(cr,cnx) = abre_mysql()
	query = ("INSERT INTO coletaFull (sinal,ID,latitude,longitude,operadora,data,tecnologia,precisao) VALUES (%f,%d,%f,%f,'%s','%s','%s',%f);" % (col.sinal,-1,col.latitude,col.longitude,col.operadora,col.data,col.tecnologia,col.precisao))
	print query+'\n'
	cr.execute(query)
	cnx.commit()
	if ( ( (col.latitude > -27.621) & (col.latitude < -27.601) ) & ((col.longitude > -48.653) | (col.longitude < -48.623))):
		col.enquadra_ponto()
		query = ("SELECT sinal from coletaEnquadrada where latitude = %f and longitude = %f and tecnologia = '%s' and operadora = '%s'" % (col.latitude, col.longitude,col.tecnologia,col.operadora))
		cr.execute(query)
		resultado = cr.fetchall()
		linhas = cr.rowcount
		sinal_new = 0;
		P = 0.75 ## Fator de envelhecimento 75% de peso para o sinal antigo e 25% para o novo
		if(linhas == 0):
			query = ("INSERT INTO coletaEnquadrada (sinal,latitude,longitude,operadora,tecnologia) VALUES (%d,%f,%f,'%s','%s');" % (col.sinal,col.latitude,col.longitude,col.operadora,col.tecnologia))
			cr.execute(query)
			cnx.commit()
			fecha_mysql(cr,cnx)
		else:
			query = ("SELECT sinal from coletaEnquadrada where latitude = %f and longitude = %f and tecnologia = '%s' and operadora = '%s'" % (col.latitude, col.longitude,col.tecnologia, col.operadora))
			print query+'\n'
			cr.execute(query)
			old_signals = cr.fetchall()
			print "O SINAL ATUAL NO BANCO E:"
			for result in resultado:
				sinal = result[0]
			print sinal
			print "SINAL ENVELHECIDO"
			sinal_new = sinal*P +col.sinal*(1-P)
			print sinal_new
			print '\n'
			query = ("UPDATE coletaEnquadrada SET sinal = %f WHERE latitude = %f and longitude = %f and tecnologia = '%s' and operadora = '%s'" % (sinal_new, col.latitude, col.longitude,col.tecnologia, col.operadora))
			cr.execute(query)
			cnx.commit()
			fecha_mysql(cr,cnx)
	else:
		fecha_mysql(cr,cnx)
	return jsonify({'ACK': 'OK'}), 201



###################################        CADASTRO DE USUARIO        ###################################


@app.route('/cadastro',methods=['POST'])
def cadastro():
	if not request.json:
		abort(400)
	email = request.json['email']
	senha = request.json['senha']
	telefone = request.json['telefone']
	nome = request.json['nome']
	data = request.json['data']
	(cr,cnx) = abre_mysql()
	query = ("SELECT usuario_id from usuario where email = '%s' OR telefone = '%s'" % (email,telefone))
	cr.execute(query)
	resultados = cr.fetchall()
	linhas = cr.rowcount
	if (linhas == 0):
		query = ("INSERT INTO usuario (email,senha,telefone,nome,data) VALUES('%s','%s','%s','%s','%s')" % (email,senha,telefone,nome,data))
		print query+'\n'
		cr.execute(query)
		cnx.commit()
		fecha_mysql(cr,cnx)
		return jsonify({'ok': '1'}), 201
	else:
		return jsonify({'ok': '-1'}), 201
		fecha_mysql(cr,cnx)



###################################        LOGIN        ###################################
@app.route('/login',methods=['POST'])
def login():
	if not request.json:
		abort(400)
	user = request.json['email']
	senha = request.json['senha']
	query = ("SELECT usuario_id from usuario where (email = '%s' or telefone = '%s') and senha = '%s'" % (user,user,senha))
	print query
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	resultados = cr.fetchall()
	for result in resultados:
		print ("ID do usuario - %s : "% user) + str(result[0]) + '\n'
	linhas = cr.rowcount
	if ( linhas == 1) :
		print "usuario ok"+'\n'
		return jsonify({'id': result[0]}), 201
	else :
		print "usuario nao encontrado"+'\n'
		return jsonify({'id': str(-1)}), 201
	fecha_mysql(cr,cnx)


###################################        OBTER TODAS AS COLETAS        ###################################

@app.route('/obtertodas', methods=['GET'])
def obtem_todas():
	query = "SELECT * FROM coletaFull"

	print "OBTER TODAS AS COLETAS"+'\n'
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	print cr.rowcount
	fecha_mysql(cr,cnx)
	coletas = []
	for c in result:
		coleta = {
			'sinal': c[0],
			'latitude': c[1],
			'longitude': c[2],
			'operadora': c[3],
			'data': c[4],
			'tecnologia': c[5],
			'precisao': c[6]}
	        coletas.append(coleta)
	return jsonify({'coletas': coletas})


	###################################        COLETA OPERADORA        ###################################
@app.route('/result/<string:Op>/<string:Tec>', methods=['GET'])
def result(Op,Tec):
	query = ("SELECT sinal, latitude, longitude FROM coletaEnquadrada WHERE operadora = '%s' and tecnologia = '%s'" % (Op,Tec))
	print ("Obter coletas enquadradas da operadora = '%s' e tecnologia = '%s'" % (Op,Tec))
	print '\n'
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	fecha_mysql(cr,cnx)
	coletas = []
	for c in result:
		coleta = {
			'sinal': c[0],
			'latitude': c[1],
			'longitude': c[2]
            }
		coletas.append(coleta)
	return jsonify(coletas)

###################################        TOTAL DE COLETAS        ###################################
@app.route('/coletas', methods=['GET'])
def obtem_num_coletas():
	query = "SELECT * FROM coletaFull"
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	num = cr.rowcount
	fecha_mysql(cr,cnx)
	return jsonify({'total': num})

	###################################        TOTAL DE COLETAS ENQUADRADAS POR OPERADORA      ###################################
@app.route('/coletas/<string:Op>', methods=['GET'])
def obtem_num_coleta_Op(Op):
	query = query = ("SELECT sinal, latitude, longitude FROM coletaEnquadrada WHERE operadora = '%s'" % Op)
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	num = cr.rowcount
	fecha_mysql(cr,cnx)
	return jsonify({'total': num})

	###################################        TOTAL DE COLETAS ENQUADRADAS POR OPERADORA E TECNOLOGIA      ###################################
@app.route('/coletas/<string:Op>/<string:Tec>', methods=['GET'])
def obtem_num_coleta_OpTec(Op, Tec):
	query = query = ("SELECT sinal, latitude, longitude FROM coletaEnquadrada WHERE operadora = '%s' and tecnologia = '%s'" % (Op,Tec))
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	num = cr.rowcount
	fecha_mysql(cr,cnx)
	return jsonify({'total': num})

###################################        TOTAL DE USUARIOS        ###################################
@app.route('/usuarios', methods=['GET'])
def obtem_num_usuario():
	query = "SELECT * FROM usuario"
	(cr,cnx) = abre_mysql()
	cr.execute(query)
	result = cr.fetchall()
	num = cr.rowcount
	fecha_mysql(cr,cnx)
	return jsonify({'total': num})



###################################        QUANDO COM ERROS        ###################################
@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)

if __name__ == "__main__":
	print "Servidor no ar!"
	pontos = []
	for i in range(0,500):
		pontos.append([0]*750)
	pontos[0][0] = [-27.621,-48.653]
	R = 0.00004
	for i in range(0,500):
		for j in range(0,750):
			pontos[i][j] = [-27.621+i*R, -48.653+j*R]
	app.run(host="0.0.0.0", port=5013, debug=True)

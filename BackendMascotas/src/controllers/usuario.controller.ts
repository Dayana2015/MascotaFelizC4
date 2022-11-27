import {authenticate} from '@loopback/authentication';
import {service} from '@loopback/core';
import {
  Count,
  CountSchema, Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, HttpErrors, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Credenciales, Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {AutenticacionService} from '../services';
const fetch = require("node-fetch");

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AutenticacionService)
    public servicioAutenticacion: AutenticacionService
  ) { }
  @post("/identificarUsuario", {
    responses: {
      "200": {
        description: "Identificacion de Usuarios"
      }
    }

  })
  async identificarUsuario(
    @requestBody() credenciales: Credenciales
  ) {
    let u = await this.servicioAutenticacion.IdentificarUsuario(credenciales.usuario, credenciales.contrasena);
    if (u) {
      let token = this.servicioAutenticacion.GenerarTokenJWT(u);
      return {
        datos: {
          nombre: u.nombre,
          correo: u.correo,
          id: u.id
        },
        tk: token
      }
    } else {
      throw new HttpErrors[401]("Datos invalidos");
    }
  }

  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario> {
    let clave = this.servicioAutenticacion.GenerarClave();
    let claveCifrada = this.servicioAutenticacion.CifrarClave(clave);
    usuario.contrasena = claveCifrada;
    let u = await this.usuarioRepository.create(usuario);
    //notificar usuario
    let destino = usuario.correo;
    let asunto = "REGISTRO EXITO, BIENVENIDO A MASCOTA FELIZ"
    let contenido = `Hola  ${usuario.nombre}, tu usuario registrado es  ${usuario.correo}, la contraseña asignada es: ${clave}`;
    fetch(`http://127.0.0.1:5000/email?correo_destino=${destino}&asunto=${asunto}&contenido=${contenido}`)
      .then((data: any) => {
        console.log(data);
      })
    return u;
  }

  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }
  @authenticate.skip()
  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }
  //metodos adicinales

  @post('/identificar-rol')
  @response(200, {
    description: 'Identificación de Rol',
    content: {'application/json': {schema: getModelSchemaRef(Credenciales)}},
  })
  async identificarRol(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credenciales, {
            title: 'Identificar Rol',

          }),
        },
      },
    })
    credenciales: Credenciales,

  ): Promise<object | null> {
     let usuario = await this.usuarioRepository.findOne({
      where:{
        correo:credenciales.usuario,
        contrasena: credenciales.contrasena
      }
     });
     if(usuario){

     }
     return usuario;

  }

}

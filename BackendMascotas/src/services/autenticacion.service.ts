import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Llaves} from '../config/llaves';
import {Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
const generador = require("password-generator");
const cryptpJS = require("crypto-js");
const jwt = require("jsonwebtoken");

@injectable({scope: BindingScope.TRANSIENT})
export class AutenticacionService {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository
  ) { }

  /*
   * Add service methods here
   */
  GenerarClave() {
    let clave = generador(8, false);
    return clave;
  }
  CifrarClave(clave: string) {
    let claveCifrada = cryptpJS.MD5(clave);
    return claveCifrada;
  }

  IdentificarUsuario(usuario: string, contrasena: string) {
    try {
      let u = this.usuarioRepository.findOne({where: {correo: usuario, contrasena: contrasena}});
      if (u) {
        return u;
      }
      return false;
    } catch {
      return false;
    }
  }
  GenerarTokenJWT(usuario: Usuario) {
    let token = jwt.sign({
      data: {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre
      }

    },
      Llaves.claveJWT);
      return token;
  }
  ValidarTokenJWT(token: string) {
    try {
      let datos = jwt.verify(token, Llaves.claveJWT);
      return datos;
    } catch {
      return false;

    }
  }

}

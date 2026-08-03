const _ = require("lodash")
const { obtener_token, verificar_token, cargar_usuario } = require("./auth")

// Controla el acceso por rol/permiso. `paths` es un arreglo de:
//   { path: "/user/info", permisos: ["usuarios.ver"], public: false }
// - public:true  -> no exige autenticacion
// - sin permisos -> solo exige sesion valida
// - con permisos -> exige sesion valida y que el usuario tenga al menos uno
exports.check_roles = async function (request, response, next, paths) {
  console.log(`Check roles path: ${request.path} method: ${request.method} `)

  const public_path = _.find(paths, { path: request.path, public: true })
  if (public_path) {
    next()
    return
  }

  // Rutas que no estan declaradas en `paths` se protegen por defecto
  const token = obtener_token(request)
  if (!token) {
    return response.send({ stat: false, code: "DO_LOGIN", text: "No hay sesion activa" })
  }

  let payload
  try {
    payload = verificar_token(token)
  } catch (err) {
    return response.send({ stat: false, code: "DO_LOGIN", text: "Token invalido o expirado" })
  }

  const usuario = await cargar_usuario(payload.id)
  if (!usuario) {
    return response.send({ stat: false, code: "DO_LOGIN", text: "Usuario no encontrado" })
  }

  // Sesion disponible para handlers posteriores
  request.session = { isLogged: true, u_data: usuario }

  const matching_path = _.find(paths, { path: request.path })
  if (matching_path && matching_path.permisos && matching_path.permisos.length > 0) {
    const tiene_permiso = matching_path.permisos.some((p) => usuario.permisos.includes(p))
    if (!tiene_permiso) {
      return response.send({ stat: false, code: "DO_LOGIN", text: "Permisos insuficientes" })
    }
  }

  next()
}

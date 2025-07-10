import request from '../../helpers/requestAdmin'

export function getAllRoles() {
  return request({
    url: '/rbac/get_roles',
    method: 'get',

  })
}



export function asignarUsuarioRol( data ) {
  return request({
    url: '/rbac/asignar_usuario_rol',
    method: 'post',
    data: data
  })
}

export function crearRol( data ) {
  return request({
    url: '/rbac/nuevo_rol',
    method: 'post',
    data: data
  })
}

export function borrarRol( data ) {
  return request({
    url: '/rbac/eliminar_rol',
    method: 'delete',
    data: data
  })
}

export function editarRol( data ) {
  return request({
    url: '/rbac/editar_rol',
    method: 'put',
    data: data
  })
}

export function getAllPermisos() {
  return request({
    url: '/rbac/get_permisos',
    method: 'get',

  })
}

export function crearPermiso( data ) {
  return request({
    url: '/rbac/nuevo_permiso',
    method: 'post',
    data: data
  })
}

export function borrarPermiso( data ) {
  return request({
    url: '/rbac/eliminar_permiso',
    method: 'delete',
    data: data
  })
}

export function editarPermiso( data ) {
  return request({
    url: '/rbac/editar_permiso',
    method: 'put',
    data: data
  })
}

export function getAllRutas() {
  return request({
    url: '/rbac/get_rutas',
    method: 'get',

  })
}

export function crearRuta( data ) {
  return request({
    url: '/rbac/nueva_ruta',
    method: 'post',
    data: data
  })
}

export function borrarRuta( data ) {
  return request({
    url: '/rbac/eliminar_ruta',
    method: 'delete',
    data: data
  })
}

export function editarRuta( data ) {
  return request({
    url: '/rbac/editar_ruta',
    method: 'put',
    data: data
  })
}

export function vincularPermiso( data ) {
  return request({
    url: '/rbac/asignar_permiso_rol',
    method: 'post',
    data: data
  })
}
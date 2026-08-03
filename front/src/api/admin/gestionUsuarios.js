import request from '../../helpers/requestAdmin'

export function get_all(params) {
  return request({
    url: '/user/get_all',
    method: 'get',
    params,
  })
}

export function add_one(data) {
  return request({
    url: '/user/add_one',
    method: 'post',
    data,
  })
}

export function put_one(data) {
  return request({
    url: '/user/put_one',
    method: 'put',
    data,
  })
}

export function delete_one(data) {
  return request({
    url: '/user/delete_one',
    method: 'delete',
    data,
  })
}

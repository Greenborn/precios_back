import create from './request'

const service = create(import.meta.env.VITE_APP_BACKEND_ADMIN+'/admin/')

export default service

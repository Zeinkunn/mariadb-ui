import axios from 'axios'
import { useConnectionStore } from '../store/connectionStore'

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
})

// Intercept responses to handle backend nodemon restarts
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.data?.error === 'Not connected to any database.') {
            // Force disconnect if the backend pool was wiped
            useConnectionStore.getState().disconnect()
        }
        return Promise.reject(error)
    }
)

export default api

// Connection
export const connect = (cfg: { host: string; port: string; user: string; password: string }) =>
    api.post('/connect', cfg)
export const getConnectionStatus = () => api.get('/connect/status')
export const disconnect = () => api.delete('/connect')

// Databases
export const getDatabases = () => api.get('/databases')
export const createDatabase = (name: string, charset?: string, collation?: string) =>
    api.post('/databases', { name, charset, collation })
export const dropDatabase = (db: string) => api.delete(`/databases/${db}`)
export const getDatabaseInfo = (db: string) => api.get(`/databases/${db}/info`)

// Tables
export const getTables = (db: string) => api.get(`/databases/${db}/tables`)
export const createTable = (db: string, payload: object) => api.post(`/databases/${db}/tables`, payload)
export const dropTable = (db: string, tbl: string, type?: string) =>
    api.delete(`/databases/${db}/tables/${tbl}`, { params: { type } })
export const truncateTable = (db: string, tbl: string) =>
    api.post(`/databases/${db}/tables/${tbl}/truncate`)

// Schema
export const getTableSchema = (db: string, tbl: string) =>
    api.get(`/databases/${db}/tables/${tbl}/schema`)
export const addColumn = (db: string, tbl: string, col: object) =>
    api.post(`/databases/${db}/tables/${tbl}/schema/columns`, col)
export const modifyColumn = (db: string, tbl: string, colName: string, col: object) =>
    api.put(`/databases/${db}/tables/${tbl}/schema/columns/${colName}`, col)
export const dropColumn = (db: string, tbl: string, colName: string) =>
    api.delete(`/databases/${db}/tables/${tbl}/schema/columns/${colName}`)

// Data
export const getTableData = (db: string, tbl: string, params?: object) =>
    api.get(`/databases/${db}/tables/${tbl}/data`, { params })
export const insertRow = (db: string, tbl: string, row: object) =>
    api.post(`/databases/${db}/tables/${tbl}/data`, row)
export const updateRow = (db: string, tbl: string, where: object, set: object) =>
    api.put(`/databases/${db}/tables/${tbl}/data`, { where, set })
export const deleteRow = (db: string, tbl: string, where: object) =>
    api.delete(`/databases/${db}/tables/${tbl}/data`, { data: { where } })

// Query
export const executeQuery = (sql: string, database?: string) =>
    api.post('/query', { sql, database })

// Users
export const getUsers = () => api.get('/users')
export const createUser = (user: string, host: string, password: string) =>
    api.post('/users', { user, host, password })
export const dropUser = (user: string, host: string) =>
    api.delete(`/users/${user}/${host}`)
export const setUserPassword = (user: string, host: string, password: string) =>
    api.put(`/users/${user}/${host}/password`, { password })
export const getUserGrants = (user: string, host: string) =>
    api.get(`/users/${user}/${host}/grants`)
export const grantPrivileges = (user: string, host: string, payload: object) =>
    api.post(`/users/${user}/${host}/grants`, payload)
export const revokePrivileges = (user: string, host: string, payload: object) =>
    api.delete(`/users/${user}/${host}/grants`, { data: payload })

// Server
export const getServerStatus = () => api.get('/server/status')
export const getServerVariables = () => api.get('/server/variables')
export const setServerVariable = (name: string, value: string) =>
    api.put(`/server/variables/${name}`, { value })
export const getProcessList = () => api.get('/server/processes')
export const killProcess = (id: number) => api.delete(`/server/processes/${id}`)
export const getCharsets = () => api.get('/server/charsets')
export const getCollations = () => api.get('/server/collations')

// Export/Import
export const exportDatabase = (db: string, tables?: string) =>
    `/api/export/${db}${tables ? `?tables=${tables}` : ''}`
export const exportTableCsv = (db: string, tbl: string) =>
    `/api/export/${db}/${tbl}/csv`
export const importSql = (database: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('database', database)
    return api.post('/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

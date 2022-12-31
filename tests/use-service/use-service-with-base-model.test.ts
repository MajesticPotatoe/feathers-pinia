import type { Tasks, TasksData, TasksQuery } from '../feathers-schema-tasks'
import { useService } from '../../src'
import { useInstanceDefaults, useBaseModel, ModelInstance } from '../../src/use-base-model/index'
import { api } from '../feathers'
import { defineStore, createPinia } from 'pinia'
import { feathersPiniaHooks } from '../../src/hooks'
import { resetStores } from '../test-utils'

const pinia = createPinia()
const service = api.service('tasks')
const modelFn = (data: ModelInstance<Tasks>) => {
  const withDefaults = useInstanceDefaults({ test: true, foo: 'bar' }, data)
  return withDefaults
}
const Task = useBaseModel<Tasks, TasksQuery, typeof modelFn>({ name: 'Task', idField: '_id' }, modelFn)
export type TaskInstance = ReturnType<typeof Task>

export const useTaskStore = defineStore('tasks', () => {
  const serviceUtils = useService<TaskInstance, TasksData, TasksQuery, typeof modelFn>({
    service,
    idField: '_id',
    Model: Task,
  })

  return { ...serviceUtils }
})
const taskStore = useTaskStore(pinia)
Task.setStore(taskStore)

const task = Task({})
console.log(Task)
console.log(task)

service.hooks({
  around: {
    all: [...feathersPiniaHooks(Task)],
  },
})

const reset = () => {
  resetStores(service, taskStore)
}

describe('use-service', () => {
  beforeEach(async () => {
    reset()
    service.store = {
      1: { _id: '1', description: 'Moose' },
      2: { _id: '2', description: 'moose' },
      3: { _id: '3', description: 'Goose' },
      4: { _id: '4', description: 'Loose' },
    }
  })

  describe('find', () => {
    test('store.find adds to store and returns store instance', async () => {
      const response = await taskStore.find({ query: { description: 'Moose' } })
      const [task] = response.data
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('feathers.find adds to store and returns store instance', async () => {
      const response = await api.service('tasks').find({ query: { description: 'Moose' } })
      const [task] = response.data
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })
  })

  describe('get', () => {
    test('store.get adds to store and returns store instance', async () => {
      const task = await taskStore.get('1')
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('feathers.get adds to store and returns store instance', async () => {
      const task = await api.service('tasks').get('1')
      expect(task.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task)
      expect(task._id).toBe('1')
    })

    test('store.get skip if exists', async () => {
      await taskStore.get('1')
      api.service('tasks').store[1] = { _id: '1', description: 'Moose changed' }

      const task2 = await taskStore.get('1', { skipRequestIfExists: true })
      expect(task2.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task2)
      expect(task2.description).toBe('Moose')
      expect(task2._id).toBe('1')

      await taskStore.get('1')
      expect(task2.description).toBe('Moose changed')
    })

    test('store.get skip if exists', async () => {
      await api.service('tasks').get('1')
      api.service('tasks').store[1] = { _id: '1', description: 'Moose changed' }

      const task2 = await api.service('tasks').get('1', { skipRequestIfExists: true })
      expect(task2.__modelName).toBe('Task')
      expect(taskStore.getFromStore('1')).toBe(task2)
      expect(task2.description).toBe('Moose')
      expect(task2._id).toBe('1')

      await api.service('tasks').get('1')
      expect(task2.description).toBe('Moose changed')
    })
  })

  test('store.patch updates the store', async () => {
    const stored = await taskStore.get('1')
    const task = await taskStore.patch('1', { description: 'Moose patched' })
    expect(task.__modelName).toBe('Task')
    expect(stored).toBe(task)
    expect(task.description).toBe('Moose patched')
  })

  test('store.remove removes item from store', async () => {
    await taskStore.get('1')
    const task = await taskStore.remove('1')
    expect(task.__modelName).toBe('Task')
    expect(taskStore.getFromStore('1')).toBe(null)
  })

  test('feathers.remove removes item from store', async () => {
    await taskStore.get('1')
    const task = await api.service('tasks').remove('1')
    expect(task.__modelName).toBe('Task')
    expect(taskStore.getFromStore('1')).toBe(null)
  })
})

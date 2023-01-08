import type { FeathersModelStatic, ModelInstanceData, UseFeathersModelOptions } from './types'
import { type AnyData, useService, UseFindWatchedOptions, UseGetOptions } from '../use-service'
import { reactive } from 'vue-demi'
import type { UseFindParams } from '../use-find'
import type { UseGetParams } from '../use-get'
import type { MaybeRef } from '../utility-types'
import { Id } from '@feathersjs/feathers/lib'
import { useFindWatched } from '../use-find-watched'
import { useGetWatched } from '../use-get-watched'

/**
 * Adds the useService utilities to the Model
 * @param Model
 * @returns Model
 */
export const wrapModelFeathers = <
  M extends AnyData,
  D extends AnyData,
  Q extends AnyData,
  ModelFunc extends (data: ModelInstanceData<M>) => any,
>(
  options: UseFeathersModelOptions,
  Model: ModelFunc,
) => {
  const _Model = Model as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
  const { service } = options

  Object.assign(Model, { service })

  // Add a `setStore` property to the Model
  const setStore = (store: any) => {
    _Model.store = store
    if (store.setModel) {
      store.setModel(_Model)
    }
  }
  Object.assign(_Model, { setStore })

  // Initialize `useService` as the default store. It can be replaced by calling `Model.setStore(store)`
  const store = useService<M, D, Q, typeof _Model>({ ...options, Model: _Model })
  _Model.setStore(reactive(store))

  // Add getters for key methods
  Object.assign(Model, {
    get findInStore() {
      return _Model.store.findInStore
    },
    get countInStore() {
      return _Model.store.countInStore
    },
    get getFromStore() {
      return _Model.store.getFromStore
    },
    get addToStore() {
      return _Model.store.addToStore
    },
    get removeFromStore() {
      return _Model.store.removeFromStore
    },
    get find() {
      return _Model.store.find
    },
    get count() {
      return _Model.store.count
    },
    get get() {
      return _Model.store.get
    },
    get create() {
      return _Model.store.create
    },
    get update() {
      return _Model.store.update
    },
    get patch() {
      return _Model.store.patch
    },
    get remove() {
      return _Model.store.remove
    },
    useFind: function (params: MaybeRef<UseFindParams>) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this })
      return _Model.store.useFind(_params)
    },
    useGet: function (_id: MaybeRef<Id | null>, params: MaybeRef<UseGetParams> = {}) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this })
      return _Model.store.useGet(_id as Id, _params as MaybeRef<any>)
    },
    useGetOnce: function (_id: MaybeRef<Id | null>, params: MaybeRef<UseGetParams> = {}) {
      const _params: any = params
      Object.assign(_params.value || params, { store: this, immediate: false, onServer: true })
      const results = _Model.store.useGet(_id as Id, _params as MaybeRef<any>)
      results.queryWhen(() => !results.data.value)
      results.get()
      return results
    },
    useFindWatched: function (options: UseFindWatchedOptions) {
      return useFindWatched({ model: _Model, ...(options as any) })
    },
    useGetWatched: function (options: UseGetOptions) {
      return useGetWatched({ model: _Model, ...options })
    },
  })

  _Model.associations = {}

  return Model as ModelFunc & FeathersModelStatic<M, D, Q, ModelFunc>
}

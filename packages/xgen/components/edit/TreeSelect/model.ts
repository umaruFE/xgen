import { makeAutoObservable,toJS } from 'mobx'
import { injectable } from 'tsyringe'

import { Remote } from '@/models'

import type { TreeSelectProps } from 'antd'

@injectable()
export default class Index {
	get options(): TreeSelectProps['treeData'] {
		const options_json = toJS(this.remote.options)
		return options_json
	}

	constructor(public remote: Remote) {
		makeAutoObservable(this, {}, { autoBind: true })
	}
}

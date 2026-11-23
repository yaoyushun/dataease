<script lang="ts" setup>
import { toRefs, PropType, ref, Ref, onBeforeMount, watch, nextTick, computed, inject } from 'vue'
import { type DatePickType } from 'element-plus-secondary'
import { dvMainStoreWithOut } from '@/store/modules/data-visualization/dvMain'
import type { ManipulateType } from 'dayjs'
import { type TimeRange } from './time-format'
import dayjs from 'dayjs'
import { useI18n } from '@/hooks/web/useI18n'
import { useShortcuts, TIME_SHORTCUT_PRESETS } from './shortcuts'
import {
  getThisStart,
  getThisEnd,
  getLastStart,
  getAround,
  getAroundStart,
  getCustomRange
} from './time-format-dayjs'
import VanPopup from 'vant/es/popup'
import VanDatePicker from 'vant/es/date-picker'
import VanTimePicker from 'vant/es/time-picker'
import VanPickerGroup from 'vant/es/picker-group'
import 'vant/es/popup/style'
import 'vant/es/date-picker/style'
import 'vant/es/picker-group/style'
import 'vant/es/time-picker/style'

interface SelectConfig {
  selectValue: any
  defaultValue: any
  defaultValueCheck: boolean
  id: string
  queryConditionWidth: number
  displayType: string
  timeGranularity: DatePickType
  timeGranularityMultiple: DatePickType
  timeRange: TimeRange
  placeholder: string
  setTimeRange: boolean
}
const { t } = useI18n()

const props = defineProps({
  config: {
    type: Object as PropType<SelectConfig>,
    default: () => {
      return {
        selectValue: '',
        defaultValue: '',
        queryConditionWidth: 0,
        defaultValueCheck: false,
        displayType: '1',
        timeGranularity: 'date',
        setTimeRange: false,
        timeGranularityMultiple: 'daterange',
        timeRange: {
          intervalType: 'none',
          dynamicWindow: false,
          maximumSingleQuery: 0,
          regularOrTrends: 'fixed',
          regularOrTrendsValue: '',
          relativeToCurrent: 'custom',
          timeNum: 0,
          relativeToCurrentType: 'year',
          around: 'f',
          timeNumRange: 0,
          relativeToCurrentTypeRange: 'year',
          aroundRange: 'f'
        }
      }
    }
  },
  isConfig: {
    type: Boolean,
    default: false
  }
})
const placeholder: Ref = inject('placeholder')
const placeholderText = computed(() => {
  if (placeholder?.value?.placeholderShow) {
    return props.config.placeholder
  }
  return ' '
})
const selectValue = ref()
const multiple = ref(false)
const dvMainStore = dvMainStoreWithOut()
const { config } = toRefs(props)
const minDate = new Date('1970/1/1')
const maxDate = new Date('2100/1/1')
watch(
  () => config.value.defaultValue,
  val => {
    if (props.isConfig) return
    const isMultiple = config.value.displayType === '7'
    if (isMultiple) {
      multiple.value = isMultiple
    }
    selectValue.value = Array.isArray(val) ? [...val] : val
    nextTick(() => {
      multiple.value = isMultiple
    })
  }
)
const callback = param => {
  startWindowTime.value = param[0]
  const disabled = param.some(ele => {
    return disabledDate(ele)
  })
  startWindowTime.value = 0
  return disabled
}

const { shortcuts } = useShortcuts(callback)

watch(
  () => config.value.id,
  () => {
    init()
  }
)

const displayTypeChange = () => {
  if (!props.isConfig) return
  if (multiple.value && config.value.displayType === '7') return
  selectValue.value = config.value.displayType === '7' ? [] : undefined
  multiple.value = config.value.displayType === '7'
  config.value.defaultValue = multiple.value ? [] : undefined
  selectValue.value = multiple.value ? [] : undefined
}
watch(
  () => config.value.selectValue,
  val => {
    if (props.isConfig) return
    if (config.value.displayType === '7') {
      selectValue.value = Array.isArray(val) ? [...val] : val
    }
    nextTick(() => {
      multiple.value = config.value.displayType === '7'
      if (!multiple.value) {
        selectValue.value = Array.isArray(config.value.selectValue)
          ? [...config.value.selectValue]
          : config.value.selectValue
      }
    })
  }
)

const handleValueChange = () => {
  if (selectValue.value === null) {
    selectValue.value = multiple.value ? [] : undefined
  }

  selectValue.value = Array.isArray(selectValue.value)
    ? selectValue.value.map(ele => ele && dayjs(ele).format('YYYY/MM/DD HH:mm:ss'))
    : selectValue.value && dayjs(selectValue.value).format('YYYY/MM/DD HH:mm:ss')
  const value = Array.isArray(selectValue.value) ? [...selectValue.value] : selectValue.value
  if (!props.isConfig) {
    config.value.selectValue = Array.isArray(selectValue.value)
      ? [...selectValue.value]
      : selectValue.value
    nextTick(() => {
      isConfirmSearch(config.value.id)
    })
    return
  }
  if (!value) {
    config.value.defaultValue = undefined
    return
  }
  config.value.defaultValue = Array.isArray(value)
    ? value.map(ele => new Date(ele).toLocaleString())
    : new Date(value).toLocaleString()
}

const init = () => {
  const { defaultValueCheck, displayType, defaultValue } = config.value
  const plus = displayType === '7'
  if (defaultValueCheck) {
    config.value.selectValue = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue
    selectValue.value = Array.isArray(defaultValue) ? [...defaultValue] : defaultValue
  } else {
    config.value.selectValue = plus ? [] : undefined
    selectValue.value = plus ? [] : undefined
  }
  multiple.value = config.value.displayType === '7'
  currentDate.value = currentDate.value.slice(0, getIndex() + 1)
}

const queryConditionWidth = inject('com-width', Function, true)
const getCustomWidth = () => {
  if (placeholder?.value?.placeholderShow) {
    if (props.config.queryConditionWidth === undefined) {
      return queryConditionWidth()
    }
    return props.config.queryConditionWidth
  }
  return 227
}
const isConfirmSearch = inject('is-confirm-search', Function, true)
const selectStyle = computed(() => {
  return props.isConfig
    ? {}
    : {
        width: (multiple.value ? getCustomWidth() * 2 : getCustomWidth()) + 'px !important'
      }
})

const columnsType = computed(() => {
  if (!dvMainStore.mobileInPc) return []
  return ['year', 'month', 'day'].slice(0, getIndex() + 1)
})

const showTimePick = computed(() => {
  if (!dvMainStore.mobileInPc) return false
  const type = multiple.value ? config.value.timeGranularityMultiple : config.value.timeGranularity
  return type.includes('datetime')
})
const currentTime = ref([])
const currentDate = ref(['2021', '01', '01'])
const showDate = ref(false)

const isRange = computed(() => {
  if (!dvMainStore.mobileInPc) return false
  return +config.value.displayType === 7
})

const showPopupRight = () => {
  const end = selectValue.value?.length > 1 ? selectValue.value[1] : null
  if (!!end) {
    const time = new Date(end)
    currentDate.value = [
      `${time.getFullYear()}`,
      `${time.getMonth() + 1}`,
      `${time.getDate()}`
    ].slice(0, getIndex() + 1)
    showTimePick.value &&
      (currentTime.value = [`${time.getHours()}`, `${time.getMinutes()}`, `${time.getSeconds()}`])
  }
  selectSecond.value = true
  showDate.value = true
}

const getIndex = () => {
  const type = multiple.value ? config.value.timeGranularityMultiple : config.value.timeGranularity
  const index = ['year', 'month', 'date'].findIndex(ele => type.includes(ele))
  return index
}
const startWindowTime = ref(0)
const calendarChange = val => {
  startWindowTime.value = +new Date(val[0])
}

const datePicker = ref()

const visibleChange = (visible: boolean) => {
  startWindowTime.value = 0
  if (!visible) {
    datePicker.value?.blur()
  }
}

const queryTimeType = computed(() => {
  const noTime = config.value.timeGranularityMultiple.split('time').join('').split('range')[0]
  return noTime === 'date' ? 'day' : (noTime as ManipulateType)
})

const disabledDate = val => {
  const timeStamp = +new Date(val)
  if (!config.value.setTimeRange) {
    return false
  }
  const {
    intervalType,
    regularOrTrends,
    regularOrTrendsValue,
    relativeToCurrent,
    relativeToCurrentRange,
    timeNum,
    relativeToCurrentType,
    around,
    dynamicWindow,
    maximumSingleQuery,
    timeNumRange,
    relativeToCurrentTypeRange,
    aroundRange
  } = config.value.timeRange || {}
  let isDynamicWindowTime = false

  if (startWindowTime.value && dynamicWindow) {
    isDynamicWindowTime =
      dayjs(startWindowTime.value)
        .add(maximumSingleQuery, queryTimeType.value)
        .startOf(queryTimeType.value)
        .valueOf() -
        1000 <
        timeStamp ||
      dayjs(startWindowTime.value)
        .subtract(maximumSingleQuery, queryTimeType.value)
        .startOf(queryTimeType.value)
        .valueOf() +
        1000 >
        timeStamp
  }
  if (intervalType === 'none') {
    if (dynamicWindow) return isDynamicWindowTime
    return false
  }
  let startTime
  if (relativeToCurrent === 'custom') {
    startTime = getAroundStart(relativeToCurrentType, around === 'f' ? 'subtract' : 'add', timeNum)
  } else {
    switch (relativeToCurrent) {
      case 'thisYear':
        startTime = getThisStart('year')
        break
      case 'lastYear':
        startTime = getLastStart('year')
        break
      case 'thisMonth':
        startTime = getThisStart('month')
        break
      case 'lastMonth':
        startTime = getLastStart('month')
        break
      case 'thisQuarter':
        startTime = getThisStart('quarter')
        break
      case 'thisWeek':
        startTime = getThisStart('week')
        break
      case 'today':
        startTime = getThisStart('day')
        break
      case 'yesterday':
        startTime = getLastStart('day')
        break
      case 'monthBeginning':
        startTime = getThisStart('month')
        break
      case 'monthEnd':
        startTime = getThisEnd('month')
        break
      case 'yearBeginning':
        startTime = getThisStart('year')
        break

      default:
        break
    }
  }
  const startValue = regularOrTrends === 'fixed' ? regularOrTrendsValue : startTime

  if (intervalType === 'start') {
    return (
      timeStamp < +new Date(dayjs(startValue).startOf('day').format('YYYY/MM/DD HH:mm:ss')) ||
      isDynamicWindowTime
    )
  }

  if (intervalType === 'end') {
    return timeStamp > +new Date(startValue) || isDynamicWindowTime
  }

  if (intervalType === 'timeInterval') {
    let endTime
    if (relativeToCurrentRange === 'custom') {
      startTime =
        regularOrTrends === 'fixed'
          ? new Date(
              dayjs(new Date(regularOrTrendsValue[0]))
                .startOf(queryTimeType.value)
                .format('YYYY/MM/DD HH:mm:ss')
            )
          : getAroundStart(relativeToCurrentType, around === 'f' ? 'subtract' : 'add', timeNum)
      endTime =
        regularOrTrends === 'fixed'
          ? new Date(
              dayjs(new Date(regularOrTrendsValue[1]))
                .endOf(queryTimeType.value)
                .format('YYYY/MM/DD HH:mm:ss')
            )
          : getAround(
              relativeToCurrentTypeRange,
              aroundRange === 'f' ? 'subtract' : 'add',
              timeNumRange
            )
    } else {
      ;[startTime, endTime] = getCustomRange(relativeToCurrentRange)
    }
    return (
      timeStamp < +new Date(startTime) - 1000 ||
      timeStamp > +new Date(endTime) ||
      isDynamicWindowTime
    )
  }
}

const showPopup = () => {
  if (isRange.value) {
    const [start] = selectValue.value || []
    if (!!start) {
      const time = new Date(start)
      currentDate.value = [
        `${time.getFullYear()}`,
        `${time.getMonth() + 1}`,
        `${time.getDate()}`
      ].slice(0, getIndex() + 1)
      showTimePick.value &&
        (currentTime.value = [`${time.getHours()}`, `${time.getMinutes()}`, `${time.getSeconds()}`])
    }
  } else {
    const time = selectValue.value ? new Date(selectValue.value) : new Date()
    currentDate.value = [
      `${time.getFullYear()}`,
      `${time.getMonth() + 1}`,
      `${time.getDate()}`
    ].slice(0, getIndex() + 1)
    showTimePick.value &&
      (currentTime.value = [`${time.getHours()}`, `${time.getMinutes()}`, `${time.getSeconds()}`])
  }
  selectSecond.value = false
  showDate.value = true
}

const onCancel = () => {
  showDate.value = false
}

const selectSecond = ref(false)

const setArrValue = () => {
  currentDate.value = currentDate.value.slice(0, getIndex() + 1)
  const timeFormat = [1, 2].includes(currentDate.value.length)
    ? currentDate.value.concat(Array([0, 2, 1][currentDate.value.length]).fill('01'))
    : currentDate.value
  if (isRange.value) {
    const [start, end] = selectValue.value || []
    if (selectSecond.value) {
      selectValue.value = [
        start ? start : new Date(`${timeFormat.join('/')} ${currentTime.value.join(':')}`),
        new Date(`${timeFormat.join('/')} ${currentTime.value.join(':')}`)
      ]
    } else {
      selectValue.value = [
        new Date(`${timeFormat.join('/')} ${currentTime.value.join(':')}`),
        end ? end : new Date(`${timeFormat.join('/')} ${currentTime.value.join(':')}`)
      ]
    }
  } else {
    selectValue.value = new Date(`${timeFormat.join('/')} ${currentTime.value.join(':')}`)
  }
}

const onClear = () => {
  showDate.value = false
  const { displayType } = config.value
  const plus = displayType === '7'
  config.value.selectValue = plus ? [] : undefined
  selectValue.value = plus ? [] : undefined
  handleValueChange()
}

const onConfirm = () => {
  setArrValue()
  handleValueChange()
  showDate.value = false
}
const showDateQuick = ref(false)
const showQuick = () => {
  showDateQuick.value = true
}

const emitMobile = (_, val) => {
  const [start, end] = val
  selectValue.value = [start?.format('YYYY/MM/DD HH:mm:ss'), end?.format('YYYY/MM/DD HH:mm:ss')]
  handleValueChange()
  showDateQuick.value = false
}

onBeforeMount(() => {
  init()
})

defineExpose({
  displayTypeChange
})

const formatDate = computed(() => {
  return (config.value.timeGranularityMultiple as string) === 'yearrange' ? 'YYYY' : undefined
})

const useBwCustomRange = computed(() => {
  return (
    multiple.value &&
    !dvMainStore.mobileInPc &&
    ['daterange', 'datetimerange'].includes(config.value.timeGranularityMultiple as string)
  )
})

const bwTriggerStyle = computed(() => {
  if (props.isConfig) return {}
  const w = Math.max(Number(getCustomWidth()) || 215, 195)
  return {
    width: w + 'px !important'
  }
})

const bwPopperVisible = ref(false)
const bwTabMode = ref<'static' | 'dynamic'>('dynamic')
const bwDynMode = ref<'recent' | 'recent_incl'>('recent')
const bwDynNum = ref<number>(1)
const bwDynUnit = ref<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
const bwActiveShortcut = ref<string>('')
const bwDraftRange = ref<[Date, Date]>([
  new Date(dayjs().subtract(1, 'month').startOf('day').format('YYYY/MM/DD HH:mm:ss')),
  new Date(dayjs().subtract(1, 'day').endOf('day').format('YYYY/MM/DD HH:mm:ss'))
])
const bwStaticStartStr = ref<string>('')
const bwStaticEndStr = ref<string>('')
const bwCalMonth = ref(dayjs().subtract(1, 'month').startOf('month'))
const bwCalPickAnchor = ref<string>('')
const bwCalHoverDate = ref<string>('')

const computeDynamicRange = (): [Date, Date] => {
  const n = Math.max(1, Number(bwDynNum.value) || 1)
  const unit = bwDynUnit.value
  const startDay =
    unit === 'quarter'
      ? dayjs()
          .subtract(n * 3, 'month')
          .startOf('day')
      : dayjs()
          .subtract(n, unit as ManipulateType)
          .startOf('day')
  const endDay =
    bwDynMode.value === 'recent_incl'
      ? dayjs().endOf('day')
      : dayjs().subtract(1, 'day').endOf('day')
  return [
    new Date(startDay.format('YYYY/MM/DD HH:mm:ss')),
    new Date(endDay.format('YYYY/MM/DD HH:mm:ss'))
  ]
}

const syncStaticFromDraft = () => {
  const [s, e] = bwDraftRange.value
  bwStaticStartStr.value = dayjs(s).format('YYYY-MM-DD HH:mm:ss')
  bwStaticEndStr.value = dayjs(e).format('YYYY-MM-DD HH:mm:ss')
  const sm = dayjs(s).startOf('month')
  const em = dayjs(e).startOf('month')
  bwCalMonth.value = sm.isSame(em, 'month') ? em.subtract(1, 'month') : sm
}

const applyDynamicPreview = () => {
  bwActiveShortcut.value = ''
  bwCalPickAnchor.value = ''
  bwDraftRange.value = computeDynamicRange()
  syncStaticFromDraft()
}

const onBwPopoverShow = () => {
  bwCalPickAnchor.value = ''
  bwCalHoverDate.value = ''
  if (Array.isArray(selectValue.value) && selectValue.value.length === 2) {
    const s = new Date(selectValue.value[0])
    const e = new Date(selectValue.value[1])
    if (!isNaN(+s) && !isNaN(+e)) {
      bwDraftRange.value = [s, e]
      syncStaticFromDraft()
      return
    }
  }
  bwTabMode.value = 'dynamic'
  bwDynMode.value = 'recent'
  bwDynNum.value = 1
  bwDynUnit.value = 'month'
  bwActiveShortcut.value = ''
  bwDraftRange.value = computeDynamicRange()
  syncStaticFromDraft()
}

const selectBwShortcut = (preset: { key: string; getRange: () => [Date, Date] }) => {
  bwActiveShortcut.value = preset.key
  bwCalPickAnchor.value = ''
  bwDraftRange.value = preset.getRange()
  syncStaticFromDraft()
}

const onStaticStrCommit = () => {
  const s = dayjs(bwStaticStartStr.value.trim())
  const e = dayjs(bwStaticEndStr.value.trim())
  if (s.isValid() && e.isValid()) {
    bwActiveShortcut.value = ''
    bwCalPickAnchor.value = ''
    const sd = new Date(s.format('YYYY/MM/DD HH:mm:ss'))
    const ed = new Date(e.format('YYYY/MM/DD HH:mm:ss'))
    bwDraftRange.value = +sd <= +ed ? [sd, ed] : [ed, sd]
    syncStaticFromDraft()
  }
}

const shiftCalMonth = (amount: number, unit: 'month' | 'year') => {
  bwCalMonth.value =
    amount >= 0 ? bwCalMonth.value.add(amount, unit) : bwCalMonth.value.subtract(-amount, unit)
}

interface CalCell {
  dateStr: string
  day: number
  inMonth: boolean
  isToday: boolean
}

const buildMonthGrid = (monthStart: dayjs.Dayjs): CalCell[] => {
  const startOfM = monthStart.startOf('month')
  const mondayOffset = (startOfM.day() + 6) % 7
  const gridStart = startOfM.subtract(mondayOffset, 'day')
  const todayStr = dayjs().format('YYYY-MM-DD')
  const cells: CalCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = gridStart.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    cells.push({
      dateStr,
      day: d.date(),
      inMonth: d.month() === startOfM.month(),
      isToday: dateStr === todayStr
    })
  }
  return cells
}

const bwLeftMonth = computed(() => bwCalMonth.value)
const bwRightMonth = computed(() => bwCalMonth.value.add(1, 'month'))
const bwLeftCells = computed(() => buildMonthGrid(bwLeftMonth.value))
const bwRightCells = computed(() => buildMonthGrid(bwRightMonth.value))

const bwVisualRangeStrs = computed<[string, string]>(() => {
  if (bwCalPickAnchor.value) {
    const a = bwCalPickAnchor.value
    const b = bwCalHoverDate.value || a
    return a <= b ? [a, b] : [b, a]
  }
  const [s, e] = bwDraftRange.value || []
  if (!s || !e) return ['', '']
  return [dayjs(s).format('YYYY-MM-DD'), dayjs(e).format('YYYY-MM-DD')]
})

const getCalCellClasses = (cell: CalCell) => {
  if (!cell.inMonth) return { 'is-other-month': true }
  const [vs, ve] = bwVisualRangeStrs.value
  const isStart = vs !== '' && cell.dateStr === vs
  const isEnd = ve !== '' && cell.dateStr === ve
  const inRange = vs !== '' && ve !== '' && cell.dateStr > vs && cell.dateStr < ve
  return {
    'is-today': cell.isToday,
    'is-range-start': isStart,
    'is-range-end': isEnd,
    'is-in-range': inRange
  }
}

const onCalDayClick = (cell: CalCell) => {
  if (!cell.inMonth) return
  bwActiveShortcut.value = ''
  if (!bwCalPickAnchor.value) {
    bwCalPickAnchor.value = cell.dateStr
    bwCalHoverDate.value = cell.dateStr
    return
  }
  const a = bwCalPickAnchor.value
  const b = cell.dateStr
  const [sStr, eStr] = a <= b ? [a, b] : [b, a]
  bwDraftRange.value = [
    new Date(`${sStr.replace(/-/g, '/')} 00:00:00`),
    new Date(`${eStr.replace(/-/g, '/')} 23:59:59`)
  ]
  bwCalPickAnchor.value = ''
  bwCalHoverDate.value = ''
  bwStaticStartStr.value = `${sStr} 00:00:00`
  bwStaticEndStr.value = `${eStr} 23:59:59`
}

const onCalDayHover = (cell: CalCell) => {
  if (bwCalPickAnchor.value && cell.inMonth) {
    bwCalHoverDate.value = cell.dateStr
  }
}

const bwDraftPreviewText = computed(() => {
  const [s, e] = bwDraftRange.value || []
  if (!s || !e) return ''
  return `${dayjs(s).format('YYYY-MM-DD HH:mm:ss')}至${dayjs(e).format('YYYY-MM-DD HH:mm:ss')}`
})

const bwDisplayText = computed(() => {
  if (!Array.isArray(selectValue.value) || selectValue.value.length !== 2) return ''
  const s = dayjs(selectValue.value[0])
  const e = dayjs(selectValue.value[1])
  if (!s.isValid() || !e.isValid()) return ''
  return `${s.format('YYYY-MM-DD')} ~ ${e.format('YYYY-MM-DD')}`
})

const onBwCancel = () => {
  bwPopperVisible.value = false
}

const onBwConfirm = () => {
  const [s, e] = bwDraftRange.value || []
  if (!s || !e) {
    bwPopperVisible.value = false
    return
  }
  selectValue.value = [
    dayjs(s).format('YYYY/MM/DD HH:mm:ss'),
    dayjs(e).format('YYYY/MM/DD HH:mm:ss')
  ]
  handleValueChange()
  bwPopperVisible.value = false
}

const onBwClear = () => {
  selectValue.value = []
  handleValueChange()
}
</script>

<template>
  <el-popover
    v-if="useBwCustomRange"
    v-model:visible="bwPopperVisible"
    trigger="click"
    placement="bottom-start"
    :width="740"
    :show-arrow="false"
    popper-class="bw-time-range-popper"
    @show="onBwPopoverShow"
  >
    <template #reference>
      <div
        class="bw-time-trigger ed-input__wrapper"
        :class="{ 'is-has-value': !!bwDisplayText }"
        :style="bwTriggerStyle"
      >
        <span class="bw-time-trigger__text" :class="{ 'is-placeholder': !bwDisplayText }">
          {{ bwDisplayText || placeholderText }}
        </span>
        <span
          v-if="bwDisplayText"
          class="bw-time-trigger__clear"
          title="清空时间范围"
          @click.stop="onBwClear"
        >
          ×
        </span>
        <span v-else class="bw-time-trigger__icon" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
          >
            <rect x="2" y="3" width="12" height="11" rx="1.5" />
            <path d="M5 1.8v2.4M11 1.8v2.4M2 6.5h12" />
          </svg>
        </span>
      </div>
    </template>

    <div class="bw-time-panel">
      <div class="bw-time-sidebar">
        <div class="bw-time-sidebar__title">快捷选择</div>
        <div class="bw-time-shortcuts-grid">
          <button
            v-for="preset in TIME_SHORTCUT_PRESETS"
            :key="preset.key"
            type="button"
            class="bw-shortcut-btn"
            :class="{ 'is-active': bwActiveShortcut === preset.key }"
            @click="selectBwShortcut(preset)"
          >
            {{ preset.text }}
          </button>
        </div>
      </div>

      <div class="bw-time-main">
        <div class="bw-time-main__header">
          <div class="bw-time-tabs">
            <button
              type="button"
              class="bw-time-tab"
              :class="{ 'is-active': bwTabMode === 'static' }"
              @click="bwTabMode = 'static'"
            >
              静态时间
            </button>
            <button
              type="button"
              class="bw-time-tab"
              :class="{ 'is-active': bwTabMode === 'dynamic' }"
              @click="bwTabMode = 'dynamic'"
            >
              动态时间
            </button>
          </div>
          <div class="bw-time-preview" :title="bwDraftPreviewText">
            {{ bwDraftPreviewText }}
          </div>
        </div>

        <div class="bw-time-main__body">
          <div v-if="bwTabMode === 'dynamic'" class="bw-dynamic-controls">
            <el-select
              v-model="bwDynMode"
              :teleported="false"
              style="width: 110px"
              @change="applyDynamicPreview"
            >
              <el-option label="近" value="recent" />
              <el-option label="近(含今日)" value="recent_incl" />
            </el-select>
            <el-input-number
              v-model="bwDynNum"
              :min="1"
              :max="3650"
              :controls="false"
              style="width: 84px"
              @change="applyDynamicPreview"
            />
            <el-select
              v-model="bwDynUnit"
              :teleported="false"
              style="width: 96px"
              @change="applyDynamicPreview"
            >
              <el-option label="天" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
              <el-option label="季" value="quarter" />
              <el-option label="年" value="year" />
            </el-select>
          </div>

          <div v-else class="bw-static-controls">
            <div class="bw-static-inputs">
              <input
                v-model="bwStaticStartStr"
                type="text"
                class="bw-dt-input"
                placeholder="YYYY-MM-DD HH:mm:ss"
                @blur="onStaticStrCommit"
                @keyup.enter="onStaticStrCommit"
              />
              <span class="bw-dt-sep">至</span>
              <input
                v-model="bwStaticEndStr"
                type="text"
                class="bw-dt-input"
                placeholder="YYYY-MM-DD HH:mm:ss"
                @blur="onStaticStrCommit"
                @keyup.enter="onStaticStrCommit"
              />
            </div>

            <div class="bw-cal-pair">
              <div class="bw-cal-month">
                <div class="bw-cal-header">
                  <div class="bw-cal-nav">
                    <button type="button" class="bw-cal-nav-btn" @click="shiftCalMonth(-1, 'year')">
                      «
                    </button>
                    <button
                      type="button"
                      class="bw-cal-nav-btn"
                      @click="shiftCalMonth(-1, 'month')"
                    >
                      ‹
                    </button>
                  </div>
                  <span class="bw-cal-title">{{ bwLeftMonth.format('YYYY 年 M 月') }}</span>
                  <div class="bw-cal-nav is-placeholder"></div>
                </div>
                <div class="bw-cal-weekdays">
                  <span v-for="wd in ['一', '二', '三', '四', '五', '六', '日']" :key="wd">
                    {{ wd }}
                  </span>
                </div>
                <div class="bw-cal-grid">
                  <button
                    v-for="cell in bwLeftCells"
                    :key="cell.dateStr"
                    type="button"
                    class="bw-cal-day"
                    :class="getCalCellClasses(cell)"
                    @click="onCalDayClick(cell)"
                    @mouseenter="onCalDayHover(cell)"
                  >
                    <span>{{ cell.day }}</span>
                  </button>
                </div>
              </div>

              <div class="bw-cal-month">
                <div class="bw-cal-header">
                  <div class="bw-cal-nav is-placeholder"></div>
                  <span class="bw-cal-title">{{ bwRightMonth.format('YYYY 年 M 月') }}</span>
                  <div class="bw-cal-nav">
                    <button type="button" class="bw-cal-nav-btn" @click="shiftCalMonth(1, 'month')">
                      ›
                    </button>
                    <button type="button" class="bw-cal-nav-btn" @click="shiftCalMonth(1, 'year')">
                      »
                    </button>
                  </div>
                </div>
                <div class="bw-cal-weekdays">
                  <span v-for="wd in ['一', '二', '三', '四', '五', '六', '日']" :key="wd">
                    {{ wd }}
                  </span>
                </div>
                <div class="bw-cal-grid">
                  <button
                    v-for="cell in bwRightCells"
                    :key="cell.dateStr"
                    type="button"
                    class="bw-cal-day"
                    :class="getCalCellClasses(cell)"
                    @click="onCalDayClick(cell)"
                    @mouseenter="onCalDayHover(cell)"
                  >
                    <span>{{ cell.day }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bw-time-main__footer">
          <button type="button" class="bw-footer-btn is-cancel" @click="onBwCancel">取消</button>
          <button type="button" class="bw-footer-btn is-confirm" @click="onBwConfirm">确定</button>
        </div>
      </div>
    </div>
  </el-popover>
  <el-date-picker
    v-model="selectValue"
    v-else-if="multiple"
    :key="config.timeGranularityMultiple"
    :type="config.timeGranularityMultiple"
    :style="selectStyle"
    ref="datePicker"
    @visible-change="visibleChange"
    :disabled-date="disabledDate"
    @calendar-change="calendarChange"
    :format="formatDate"
    :shortcuts="
      ['datetimerange', 'daterange'].includes(config.timeGranularityMultiple) ? shortcuts : []
    "
    @change="handleValueChange"
    :editable="false"
    :range-separator="$t('cron.to')"
    :start-placeholder="placeholderText"
    :end-placeholder="placeholderText"
  />
  <el-date-picker
    v-else
    :key="config.timeGranularity + 1"
    v-model="selectValue"
    class="icon-fixed_16"
    @visible-change="visibleChange"
    :disabled-date="disabledDate"
    :type="config.timeGranularity"
    @change="handleValueChange"
    :style="selectStyle"
    :placeholder="placeholderText"
  />
  <div
    v-if="dvMainStore.mobileInPc"
    class="vant-mobile"
    :class="isRange && 'wl50'"
    @click="showPopup"
  />
  <div v-if="dvMainStore.mobileInPc && isRange" class="vant-mobile wr50" @click="showPopupRight">
    <div class="quick-selection" @click.stop="showQuick"></div>
    <van-popup teleport="body" position="bottom" v-model:show="showDateQuick">
      <div
        @click="ele.onClick({ emit: emitMobile })"
        class="shortcuts-mobile"
        v-for="ele in shortcuts"
        :key="ele.text"
      >
        {{ ele.text }}
      </div></van-popup
    >
  </div>
  <van-popup
    v-if="dvMainStore.mobileInPc"
    teleport="body"
    position="bottom"
    v-model:show="showDate"
  >
    <van-picker-group
      @confirm="onConfirm"
      @cancel="onCancel"
      v-if="showTimePick"
      :title="t('v_query.time_selection')"
      :tabs="[t('dataset.select_date'), t('dataset.select_time')]"
      :next-step-text="t('sync_datasource.next')"
    >
      <van-date-picker
        :min-date="minDate"
        :max-date="maxDate"
        :columns-type="columnsType"
        v-model="currentDate"
      />
      <van-time-picker :columns-type="['hour', 'minute', 'second']" v-model="currentTime" />
    </van-picker-group>
    <van-date-picker
      :title="t('dataset.select_date')"
      :columns-type="columnsType"
      @confirm="onConfirm"
      @cancel="onCancel"
      :min-date="minDate"
      :max-date="maxDate"
      v-if="!showTimePick"
      v-model="currentDate"
    />
  </van-popup>
  <Teleport v-if="showDate" to=".van-picker__toolbar">
    <button
      style="position: absolute; top: 0; right: 60px"
      @click="onClear"
      class="van-picker__confirm van-haptics-feedback oooo"
    >
      {{ t('commons.clear') }}
    </button></Teleport
  >
</template>

<style lang="less">
.vant-mobile {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  &.wl50 {
    width: 50%;
  }

  &.wr50 {
    left: auto;
    right: 0;
    width: 50%;

    .quick-selection {
      position: absolute;
      top: 0px;
      right: 10px;
      width: 24px;
      height: 32px;
      z-index: 10;
    }
  }
}
.shortcuts-mobile {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #eee;
}
.icon-fixed_16 {
  .ed-input__icon {
    font-size: 16px !important;
  }
}

.bw-time-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 32px;
  padding: 0 10px 0 12px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }

  &__text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: #1f2329;

    &.is-placeholder {
      color: #8f959e;
    }
  }

  &__icon,
  &__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #8f959e;
    flex-shrink: 0;
  }

  &__clear {
    width: 16px;
    height: 16px;
    font-size: 15px;
    line-height: 1;
    border-radius: 50%;

    &:hover {
      color: #1f2329;
      background: #ebeef5;
    }
  }
}

.bw-time-range-popper {
  padding: 0 !important;
  border-radius: 8px !important;
  overflow: visible !important;
  box-shadow: 0 8px 28px rgba(31, 35, 41, 0.14) !important;
}

.bw-time-panel {
  display: flex;
  min-height: 410px;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2329;
  font-size: 13px;
}

.bw-time-sidebar {
  width: 204px;
  flex-shrink: 0;
  padding: 16px;
  border-right: 1px solid #ebeef5;
  box-sizing: border-box;

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: #646a73;
    margin-bottom: 12px;
  }
}

.bw-time-shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 8px;
}

.bw-shortcut-btn {
  height: 30px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: #f5f6f7;
  color: #1f2329;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  white-space: nowrap;

  &:hover {
    background: #e8efff;
    color: #3370ff;
  }

  &.is-active {
    background: #e8efff;
    color: #3370ff;
    font-weight: 600;
  }
}

.bw-time-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f2f5;
  }

  &__body {
    flex: 1;
    padding-top: 14px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid #f0f2f5;
  }
}

.bw-time-tabs {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-shrink: 0;
}

.bw-time-tab {
  position: relative;
  padding: 4px 0 8px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #646a73;
  cursor: pointer;

  &.is-active {
    color: #1f2329;
    font-weight: 600;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 2px;
      background: #1f2329;
      border-radius: 1px;
    }
  }
}

.bw-time-preview {
  font-size: 12px;
  color: #646a73;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bw-dynamic-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
}

.bw-static-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bw-static-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bw-dt-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 12px;
  color: #1f2329;
  background: #ffffff;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3370ff;
  }
}

.bw-dt-sep {
  color: #8f959e;
  font-size: 12px;
  flex-shrink: 0;
}

.bw-cal-pair {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.bw-cal-month {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 8px 10px 10px;
  background: #ffffff;
}

.bw-cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bw-cal-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 40px;

  &.is-placeholder {
    visibility: hidden;
  }
}

.bw-cal-nav-btn {
  width: 20px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #646a73;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0;

  &:hover {
    background: #f2f3f5;
    color: #1f2329;
  }
}

.bw-cal-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2329;
}

.bw-cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: #8f959e;
  margin-bottom: 4px;

  span {
    line-height: 24px;
  }
}

.bw-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  row-gap: 2px;
}

.bw-cal-day {
  position: relative;
  height: 28px;
  border: none;
  padding: 0;
  background: transparent;
  color: #1f2329;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    width: 24px;
    height: 24px;
    line-height: 24px;
    border-radius: 4px;
    text-align: center;
  }

  &.is-other-month {
    color: #c0c4cc;
    cursor: default;
  }

  &:not(.is-other-month):hover span {
    background: #f2f3f5;
  }

  &.is-today:not(.is-range-start):not(.is-range-end) span {
    color: #3370ff;
    font-weight: 700;
  }

  &.is-in-range {
    background: #ebf2ff;
    color: #1f2329;
  }

  &.is-range-start,
  &.is-range-end {
    background: #ebf2ff;

    span {
      background: #3370ff;
      color: #ffffff;
      font-weight: 600;
    }
  }

  &.is-range-start {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  &.is-range-end {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
}

.bw-footer-btn {
  height: 32px;
  padding: 0 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;

  &.is-cancel {
    background: #f2f3f5;
    color: #1f2329;

    &:hover {
      background: #e5e6eb;
    }
  }

  &.is-confirm {
    background: #1f2329;
    color: #ffffff;

    &:hover {
      background: #363c46;
    }
  }
}
</style>

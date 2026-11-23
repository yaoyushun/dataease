import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import type { ManipulateType, QUnitType } from 'dayjs'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import updateLocale from 'dayjs/plugin/updateLocale'
type ManipulateTypeWithQuarter = ManipulateType | 'quarter'
dayjs.extend(quarterOfYear)
dayjs.extend(updateLocale)
dayjs.updateLocale('zh-cn', {
  weekStart: 1
})
dayjs.locale('zh-cn')

function getThisStart(val = 'month' as ManipulateTypeWithQuarter) {
  return new Date(
    dayjs()
      .startOf(val as QUnitType)
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getThisEnd(val = 'month' as ManipulateTypeWithQuarter) {
  return new Date(
    dayjs()
      .endOf(val as QUnitType)
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getLastStart(val = 'month' as ManipulateTypeWithQuarter) {
  return new Date(
    dayjs()
      .subtract(1, val as QUnitType)
      .startOf(val as QUnitType)
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getLastEnd(val = 'month' as ManipulateTypeWithQuarter) {
  return new Date(
    dayjs()
      .subtract(1, val as QUnitType)
      .endOf(val as QUnitType)
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getLastQuarterStart() {
  return new Date(
    dayjs()
      .startOf('quarter' as QUnitType)
      .subtract(3, 'month')
      .startOf('quarter' as QUnitType)
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getLastQuarterEnd() {
  return new Date(
    dayjs()
      .startOf('quarter' as QUnitType)
      .subtract(1, 'day')
      .endOf('day')
      .format('YYYY/MM/DD HH:mm:ss')
  )
}

function getRecentUntilYesterday(num: number, unit: 'day' | 'month' | 'year'): [Date, Date] {
  const start = new Date(dayjs().subtract(num, unit).startOf('day').format('YYYY/MM/DD HH:mm:ss'))
  const end = new Date(dayjs().subtract(1, 'day').endOf('day').format('YYYY/MM/DD HH:mm:ss'))
  return [start, end]
}

export interface TimeShortcutPreset {
  key: string
  text: string
  getRange: () => [Date, Date]
}

export const TIME_SHORTCUT_PRESETS: TimeShortcutPreset[] = [
  { key: 'today', text: '今天', getRange: () => [getThisStart('day'), getThisEnd('day')] },
  { key: 'yesterday', text: '昨日', getRange: () => [getLastStart('day'), getLastEnd('day')] },
  { key: 'last7d', text: '近7天', getRange: () => getRecentUntilYesterday(7, 'day') },
  { key: 'last14d', text: '近14天', getRange: () => getRecentUntilYesterday(14, 'day') },
  { key: 'last30d', text: '近30天', getRange: () => getRecentUntilYesterday(30, 'day') },
  { key: 'last90d', text: '近90天', getRange: () => getRecentUntilYesterday(90, 'day') },
  { key: 'thisWeek', text: '本周', getRange: () => [getThisStart('week'), getThisEnd('week')] },
  { key: 'lastWeek', text: '上周', getRange: () => [getLastStart('week'), getLastEnd('week')] },
  { key: 'thisMonth', text: '本月', getRange: () => [getThisStart('month'), getThisEnd('month')] },
  {
    key: 'lastMonth',
    text: '上个月',
    getRange: () => [getLastStart('month'), getLastEnd('month')]
  },
  {
    key: 'lastQuarter',
    text: '上个季度',
    getRange: () => [getLastQuarterStart(), getLastQuarterEnd()]
  },
  { key: 'thisYear', text: '本年', getRange: () => [getThisStart('year'), getThisEnd('year')] },
  { key: 'last1y', text: '近一年', getRange: () => getRecentUntilYesterday(1, 'year') },
  { key: 'lastYear', text: '去年', getRange: () => [getLastStart('year'), getLastEnd('year')] },
  {
    key: 'monthToToday',
    text: '本月至今',
    getRange: () => [getThisStart('month'), getThisEnd('day')]
  },
  {
    key: 'beforeToday',
    text: '今天之前',
    getRange: () => [
      new Date('1970/01/01 00:00:00'),
      new Date(dayjs().subtract(1, 'day').endOf('day').format('YYYY/MM/DD HH:mm:ss'))
    ]
  }
]

// eslint-disable-next-line
let callback: Function = () => {}
const shortcuts = TIME_SHORTCUT_PRESETS.map(preset => ({
  text: preset.text,
  onClick: ({ emit }) => {
    const [startTime, endTime] = preset.getRange()
    if (callback([startTime, endTime])) return
    emit('pick', [dayjs(startTime), dayjs(endTime)])
  }
}))

const useShortcuts = cb => {
  callback = cb
  return {
    shortcuts
  }
}

export { useShortcuts }

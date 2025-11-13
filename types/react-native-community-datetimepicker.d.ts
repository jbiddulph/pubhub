declare module '@react-native-community/datetimepicker' {
  import type { Component } from 'react'
  import type { ViewProps } from 'react-native'

  export type DateTimePickerMode = 'date' | 'time' | 'datetime' | 'countdown'

  export type DateTimePickerDisplay = 'default' | 'spinner' | 'calendar' | 'clock' | 'inline'

  export type DateTimePickerEvent = {
    type: 'set' | 'dismissed'
    nativeEvent: {
      timestamp?: number
    }
  }

  export interface CommonAndroidOptions {
    value: Date
    onChange: (event: DateTimePickerEvent, date?: Date) => void
    minimumDate?: Date
    maximumDate?: Date
    is24Hour?: boolean
    timeZoneOffsetInMinutes?: number
    positiveButtonLabel?: string
    negativeButtonLabel?: string
    neutralButtonLabel?: string
  }

  export const DateTimePickerAndroid: {
    open: (
      params: CommonAndroidOptions & {
        mode?: 'date' | 'time'
        display?: 'default' | 'spinner' | 'clock' | 'calendar'
      },
    ) => void
    dismiss: (mode?: 'date' | 'time') => void
  }

  export interface DateTimePickerProps extends ViewProps {
    value: Date
    mode?: DateTimePickerMode
    display?: DateTimePickerDisplay
    onChange?: (event: DateTimePickerEvent, date?: Date) => void
    minimumDate?: Date
    maximumDate?: Date
    locale?: string
    minuteInterval?: number
    timeZoneOffsetInMinutes?: number
  }

  export default class DateTimePicker extends Component<DateTimePickerProps> {}
}


declare module 'probot-config' {
  export function getConfig(context: Context, fileName: string, defaultConfig?: object): Promise<any>
}

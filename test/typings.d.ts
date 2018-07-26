declare module "*.json" {
  const value: any;
  export default value;
}

declare function configFn(context: Context, fileName: string, defaultConfig?: object): Promise<any>

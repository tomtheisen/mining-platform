export interface IGameState {
    money: number;
    readonly year: number;
    readonly day: number;
    readonly hour: number;
}

export interface IPlatform {
    power: number;
}
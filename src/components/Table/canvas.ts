import { Ref } from "vue"
import { theme } from "./config"

interface ILinePos {
    startX: number,
    startY: number,
    endX: number,
    endY: number
}
interface IStyle {
    lineWidth?: number,
    lineColor?: string
}


export class Canvas {
    public canvasCtx: CanvasRenderingContext2D | null = null
    constructor(canvas: Ref<HTMLCanvasElement | undefined>) {
        if (canvas && canvas.value) {
            this.canvasCtx = canvas.value!.getContext('2d')
        }
    }
    getTextWidth(text: string) {
        return this.canvasCtx!.measureText(text).width
    }

    getTargetText(text: string, width: number, iconWidth?: number) {
        const textWidth = this.getTextWidth(text)
        const realWidth = width - theme.cellPadding * 2 - (iconWidth || 0)
        if (textWidth < realWidth) return text
        const textArr = [...text]
        let index = 0
        for (let i = 0; i < textArr.length; i++) {
            index++
            let result = textArr.slice(0, index).join('') + '...'
            if (this.getTextWidth(result) > realWidth) {
                break;
            }
        }
        const result = textArr.slice(0, index - 1).join('') + '...'
        return result

    }
    drawLine(pos: ILinePos, style?: IStyle) {
        // this.canvasCtx!.save();
        this.canvasCtx!.beginPath();
        this.canvasCtx!.moveTo(pos.startX, pos.startY);
        this.canvasCtx!.lineTo(pos.endX, pos.endY);
        this.canvasCtx!.lineWidth = 1;
        this.canvasCtx!.strokeStyle = style && style.lineColor || ''
        this.canvasCtx!.closePath();
        this.canvasCtx!.stroke();
        this.canvasCtx!.restore();
    }
    fillText(
        options: {
            text: string,
            x: number,
            y: number,
            hasChar?: boolean,
            width: number,
            height: number,
            style?: {
                color?: string,
                fontFamily?: string,
                fontSize?: number,
                fontWeight?: number | string,
                align?: string
            }
        }
    ) {
        this.canvasCtx!.save();
        let { style, x, y, width, height } = options
        // 样式设置
        this.canvasCtx!.font = `${style?.fontWeight || 'normal'} ${(style?.fontSize || theme.fontSize)}px ${style?.fontFamily || theme.fontFamily}`

        this.canvasCtx!.fillStyle = style?.color || '#000'

        const targetText = this.getTargetText(options.text, width, options.hasChar ? theme.charIconWidth : 0)

        y += ((height + (style?.fontSize ||  theme.fontSize))/ 2)-2
        // 计算展示位置
        switch (style?.align) {
            case "right":
                let right = theme.cellPadding
                if (options.hasChar) {
                    right += (theme.charIconWidth + theme.cellPadding)
                }
                x = x + width - right - this.getTextWidth(targetText)
                break;
            case "center":
                const textWidth = this.getTextWidth(targetText)
                x += (width - (options.hasChar ? theme.charIconWidth : 0) - textWidth) / 2
                break;
            default:
                x = x + theme.cellPadding

        }
        this.canvasCtx!.fillText(targetText || '-', x, y)
        this.canvasCtx!.stroke();
        this.canvasCtx!.restore();
    }
    fillRect(x: number, y: number, width: number, height: number, color?: string) {
        this.canvasCtx!.save();
        this.canvasCtx!.fillStyle = color || '#fff'
        this.canvasCtx!.fillRect(x, y, width, height)
        this.canvasCtx!.stroke()
        this.canvasCtx!.restore();
    }
    drawRect(x: number, y: number, width: number, height: number, color?: string) {
        this.canvasCtx!.save();
        this.canvasCtx!.fillStyle = color || '#fff'
        this.canvasCtx!.rect(x, y, width, height)
        this.canvasCtx!.stroke()
        this.canvasCtx!.restore();
    }
    clearRect(x: number, y: number, width: number, height: number) {
        this.canvasCtx!.save();
        this.canvasCtx!.clearRect(x, y, width, height)
        this.canvasCtx!.stroke()
        this.canvasCtx!.restore();
    }
    drawImg(img: HTMLImageElement, x: number, y: number, width: number, height: number) {
        this.canvasCtx!.save();
        this.canvasCtx!.drawImage(img, x, y, width, height)
        this.canvasCtx!.stroke()
        this.canvasCtx!.restore();
    }
}

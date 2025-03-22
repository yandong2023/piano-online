// 五线谱渲染工具
class StaffRenderer {
    constructor(container) {
        this.container = container;
        this.vf = null;
        this.context = null;
        this.stave = null;
        this.init();
    }

    init() {
        // 清空容器
        this.container.innerHTML = '';
        
        // 创建渲染器
        const renderer = new Vex.Flow.Renderer(this.container, Vex.Flow.Renderer.Backends.SVG);
        renderer.resize(500, 150);
        this.context = renderer.getContext();
        
        // 创建五线谱
        this.stave = new Vex.Flow.Stave(10, 40, 480);
        this.stave.addClef('treble').addTimeSignature('4/4');
    }

    // 将音符名称转换为VexFlow音符
    convertToVexFlowNotes(noteNames) {
        return noteNames.map(noteName => {
            // 解析音符名称（例如：'C4'变成'c/4'）
            const pitch = noteName.slice(0, -1).toLowerCase();
            const octave = noteName.slice(-1);
            return new Vex.Flow.StaveNote({
                clef: 'treble',
                keys: [`${pitch}/${octave}`],
                duration: 'q'
            });
        });
    }

    // 渲染音符
    renderNotes(noteNames) {
        // 清除之前的内容
        this.init();

        // 创建音符
        const notes = this.convertToVexFlowNotes(noteNames);
        
        // 创建声部
        const voice = new Vex.Flow.Voice({
            num_beats: notes.length,
            beat_value: 4
        });
        voice.addTickables(notes);

        // 创建格式化器
        const formatter = new Vex.Flow.Formatter();
        formatter.joinVoices([voice]).format([voice], 400);

        // 绘制五线谱和音符
        this.stave.setContext(this.context).draw();
        voice.draw(this.context, this.stave);
    }

    // 清除五线谱
    clear() {
        this.container.innerHTML = '';
    }
}

// 音符工具类
class NoteUtils {
    static noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    static octaves = ['3', '4', '5'];

    // 生成随机音符
    static generateRandomNotes(difficulty, count) {
        const notes = [];
        let availableNotes;

        switch(difficulty) {
            case 'beginner':
                // 初级：只使用中央C周围的音符
                availableNotes = this.noteNames.map(note => `${note}4`);
                break;
            case 'intermediate':
                // 中级：使用两个八度的音符
                availableNotes = this.noteNames.flatMap(note => 
                    ['4', '5'].map(octave => `${note}${octave}`)
                );
                break;
            case 'advanced':
                // 高级：使用三个八度的音符
                availableNotes = this.noteNames.flatMap(note => 
                    this.octaves.map(octave => `${note}${octave}`)
                );
                break;
            default:
                availableNotes = this.noteNames.map(note => `${note}4`);
        }

        // 生成指定数量的随机音符
        for(let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * availableNotes.length);
            notes.push(availableNotes[randomIndex]);
        }

        return notes;
    }
}

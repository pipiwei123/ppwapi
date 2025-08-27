package constant

type TaskPlatform string

const (
	TaskPlatformSuno       TaskPlatform = "suno"
	TaskPlatformMidjourney              = "mj"
	TaskPlatformKling      TaskPlatform = "kling"
	TaskPlatformJimeng     TaskPlatform = "jimeng"
	TaskPlatformVeo3       TaskPlatform = "veo3"
)

const (
	SunoActionMusic  = "MUSIC"
	SunoActionLyrics = "LYRICS"

	TaskActionGenerate     = "generate"
	TaskActionTextGenerate = "textGenerate"
)

var SunoModel2Action = map[string]string{
	"suno_music":  SunoActionMusic,
	"suno_lyrics": SunoActionLyrics,
}

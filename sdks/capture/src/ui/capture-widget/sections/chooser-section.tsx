import { useMemo, useRef } from "react"
import { supportsDisplayCapture } from "../../../media/capabilities"
import { supportsDisplayAudioCapture } from "../../../media/display-capture"
import { Button } from "../components/primitives/button"

export function ChooserSection(props: {
  busy: boolean
  onStartVideo: () => void
  onTakeScreenshot: () => void
  onUploadScreenshot: (file: File) => void
}): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canDisplayCapture = useMemo(() => supportsDisplayCapture(), [])
  const capturesAudio = useMemo(() => supportsDisplayAudioCapture(), [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again re-triggers change.
    event.target.value = ""
    if (file) {
      props.onUploadScreenshot(file)
    }
  }

  return (
    <section className="grid gap-4 p-5">
      <p className="m-0 text-muted-foreground text-sm">
        {canDisplayCapture
          ? "Choose how to capture the issue."
          : "Screen capture isn't available on this browser. Attach a screenshot to file a report."}
      </p>

      {canDisplayCapture ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button
              className="w-full"
              disabled={props.busy}
              onClick={props.onStartVideo}
              type="button"
            >
              Record Video
            </Button>
            <Button
              className="w-full"
              disabled={props.busy}
              onClick={props.onTakeScreenshot}
              type="button"
              variant="outline"
            >
              Take Screenshot
            </Button>
          </div>

          <p className="m-0 text-muted-foreground text-xs">
            Your browser will ask what to share. Whatever you pick — this tab,
            another window, or a whole screen — is captured as you see it and
            attached to this report, so pick the one showing the problem and
            nothing private.
            {capturesAudio
              ? " Recording also captures the audio your browser is sharing."
              : ""}{" "}
            Nothing is captured until you choose.
          </p>
        </>
      ) : null}

      <Button
        className="w-full"
        disabled={props.busy}
        onClick={() => fileInputRef.current?.click()}
        type="button"
        variant={canDisplayCapture ? "outline" : "primary"}
      >
        Upload Screenshot
      </Button>

      <input
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />
    </section>
  )
}

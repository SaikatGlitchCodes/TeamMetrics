import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function usePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [popupContent, setPopupContent] = useState(null);
  const [popupTitle, setPopupTitle] = useState("");

  const showPopup = (content, title = "Details") => {
    setPopupContent(content);
    setPopupTitle(title);
    setIsVisible(true);
  };

  const hidePopup = () => {
    setIsVisible(false);
    setPopupContent(null);
    setPopupTitle("");
  };

  const Popup = () => {
    return (
      isVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">{popupTitle}</h2>
                <button
                  onClick={hidePopup}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              {popupContent}
              <button
                onClick={hidePopup}
                className="mt-4 w-full py-2 px-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Close
              </button>
            </CardContent>
          </Card>
        </div>
      )
    );
  };

  return { showPopup, hidePopup, Popup };
}

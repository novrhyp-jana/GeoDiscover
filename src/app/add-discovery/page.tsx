"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  Crosshair,
  ImagePlus,
  LoaderCircle,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { createClient } from "@/lib/supabase/client";

export default function AddDiscoveryPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [category, setCategory] =
    useState("Green Space");

  const [priority, setPriority] =
    useState("Standard");

  const [accessibility, setAccessibility] =
    useState("Unknown");

  const [locationName, setLocationName] =
    useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [image, setImage] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [publishing, setPublishing] =
    useState(false);

  const [error, setError] = useState("");

  const categories = [
    "Green Space",
    "Plants",
    "Wildlife",
    "Animals",
    "Environment",
    "Community",
  ];

  function handleImage(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be smaller than 8 MB.");
      return;
    }

    setError("");
    setImage(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview(null);
  }

  function getCurrentLocation() {
    setError("");
    setLocationLoading(true);

    if (!navigator.geolocation) {
      setError(
        "Location is not supported by this browser."
      );
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);

        if (!locationName) {
          setLocationName("Current location");
        }

        setLocationLoading(false);
      },

      (locationError) => {
        console.error(locationError);

        setError(
          "Could not get your location. Allow location permission and try again."
        );

        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }

  async function publishDiscovery(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Add a title.");
      return;
    }

    if (!description.trim()) {
      setError("Add a description.");
      return;
    }

    if (latitude === null || longitude === null) {
      setError(
        "Please use your current location before publishing."
      );
      return;
    }

    setPublishing(true);

    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setPublishing(false);
      router.push("/login");
      return;
    }

    let imageUrl: string | null = null;

    /* IMAGE UPLOAD */

    if (image) {
      const extension =
        image.name.split(".").pop() || "jpg";

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("discovery-images")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);

        setError(
          `Image upload failed: ${uploadError.message}`
        );

        setPublishing(false);
        return;
      }

      const { data } = supabase.storage
        .from("discovery-images")
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    /* DATABASE INSERT */

    const {
      data: discovery,
      error: insertError,
    } = await supabase
      .from("discoveries")
      .insert({
        user_id: user.id,

        title: title.trim(),

        description:
          description.trim(),

        category,

        latitude,

        longitude,

        location_name:
          locationName.trim() ||
          "Current location",

        image_url: imageUrl,

        priority,

        accessibility:
          category === "Green Space"
            ? accessibility
            : "Unknown",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);

      setError(
        `Could not publish discovery: ${insertError.message}`
      );

      setPublishing(false);
      return;
    }

    setPublishing(false);

    router.push(
      `/explore?discovery=${discovery.id}`
    );

    router.refresh();
  }

  return (
    <>
      <Navbar />

      <main className="addDiscoveryPage">
        <section className="addDiscoveryHeading">
          <p className="eyebrow">
            SHARE WITH THE COMMUNITY
          </p>

          <h1>Add a discovery</h1>

          <p>
            Found something interesting, useful or
            important? Put it on the map.
          </p>
        </section>

        <form
          className="discoveryFormLayout"
          onSubmit={publishDiscovery}
        >
          <section className="discoveryFormCard">
            <div className="formSection">
              <div className="formSectionTitle">
                <Camera size={19} />

                <div>
                  <strong>
                    Discovery photo
                  </strong>

                  <span>
                    Show the community what you found.
                  </span>
                </div>
              </div>

              {!preview ? (
                <label className="imageUploader">
                  <ImagePlus size={28} />

                  <strong>
                    Upload a photo
                  </strong>

                  <span>
                    JPG, PNG or WEBP · Max 8 MB
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImage}
                    hidden
                  />
                </label>
              ) : (
                <div className="imagePreview">
                  <img
                    src={preview}
                    alt="Discovery preview"
                  />

                  <button
                    type="button"
                    onClick={removeImage}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="formSection">
              <label className="discoveryLabel">
                Title

                <input
                  required
                  value={title}
                  maxLength={100}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="What did you discover?"
                />
              </label>

              <label className="discoveryLabel">
                Description

                <textarea
                  required
                  value={description}
                  maxLength={1000}
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                  placeholder="Tell the community what you found..."
                  rows={5}
                />
              </label>
            </div>

            <div className="formSection">
              <label className="discoveryLabel">
                Category
              </label>

              <div className="categoryChoiceGrid">
                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() =>
                      setCategory(item)
                    }
                    className={
                      category === item
                        ? "categoryChoice selectedCategoryChoice"
                        : "categoryChoice"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {category === "Green Space" && (
              <div className="formSection greenSpaceSection">
                <div className="formSectionTitle">
                  <Sparkles size={18} />

                  <div>
                    <strong>
                      Green space accessibility
                    </strong>

                    <span>
                      Helps map accessible urban
                      green spaces.
                    </span>
                  </div>
                </div>

                <label className="discoveryLabel">
                  Public accessibility

                  <select
                    value={accessibility}
                    onChange={(event) =>
                      setAccessibility(
                        event.target.value
                      )
                    }
                  >
                    <option value="Unknown">
                      Unknown
                    </option>

                    <option value="Public">
                      Public
                    </option>

                    <option value="Limited access">
                      Limited access
                    </option>

                    <option value="Private">
                      Private
                    </option>
                  </select>
                </label>
              </div>
            )}

            <div className="formSection">
              <div className="formSectionTitle">
                <MapPin size={19} />

                <div>
                  <strong>
                    Discovery location
                  </strong>

                  <span>
                    This position becomes the map
                    marker.
                  </span>
                </div>
              </div>

              <label className="discoveryLabel">
                Location name

                <input
                  value={locationName}
                  onChange={(event) =>
                    setLocationName(
                      event.target.value
                    )
                  }
                  placeholder="Example: Adyar Eco Park"
                />
              </label>

              <button
                type="button"
                className="captureLocationButton"
                onClick={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <LoaderCircle
                    className="spinner"
                    size={17}
                  />
                ) : (
                  <Crosshair size={17} />
                )}

                {locationLoading
                  ? "Finding location..."
                  : latitude !== null
                    ? "Location captured"
                    : "Use my current location"}
              </button>

              {latitude !== null &&
                longitude !== null && (
                  <div className="locationCaptured">
                    <CheckCircle2 size={15} />

                    <span>
                      {latitude.toFixed(5)},{" "}
                      {longitude.toFixed(5)}
                    </span>
                  </div>
                )}
            </div>

            <div className="formSection">
              <label className="discoveryLabel">
                Priority

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value
                    )
                  }
                >
                  <option value="Standard">
                    Standard
                  </option>

                  <option value="Notable">
                    Notable
                  </option>

                  <option value="Urgent">
                    Urgent
                  </option>
                </select>
              </label>
            </div>

            {error && (
              <div className="authError">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="publishDiscoveryButton"
              disabled={publishing}
            >
              {publishing ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="spinner"
                  />
                  Publishing...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Publish discovery
                </>
              )}
            </button>
          </section>

          <aside className="discoveryFormAside">
            <div className="formTipCard">
              <strong>
                What makes a good discovery?
              </strong>

              <p>
                Use a clear photo and describe what
                you observed.
              </p>

              <p>
                Capture the location where the
                discovery actually exists.
              </p>

              <p>
                Other nearby users can later confirm
                your report.
              </p>
            </div>

            <div className="aiComingSoon">
              <Sparkles size={21} />

              <div>
                <span>
                  AI-assisted verification
                </span>

                <strong>
                  Coming Soon
                </strong>
              </div>
            </div>
          </aside>
        </form>
      </main>
    </>
  );
}
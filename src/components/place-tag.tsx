// Information that the PlaceTag component means
type PlaceTagProps = {
  locationName: string; 
  geotag: string; 
  onClick: (geotag: string) => void; // Function is called when clicked
};

// PlaceTag component
export default function PlaceTag({
    locationName,
    geotag,
    onClick
}: PlaceTagProps){
    return (
        // Displays the location button
        <button
        type="button"
        onClick={() => onClick(geotag)}
        >
         {locationName}   
        </button>
    );
}

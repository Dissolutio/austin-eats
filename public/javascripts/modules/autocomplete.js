function autocomplete(input, latInput, lngInput) {
	if (!input) return; //skip it if no input on page
	const dropdown = new google.maps.places.Autocomplete(input);
	dropdown.addListener('place_changed', () => {
		const place = dropdown.getPlace();
		latInput.value = place.geometry.location.lat();
		lngInput.value = place.geometry.location.lng();
	});
	// If someone hits 'enter' on the address field, don't submit the form
	// because it's easy to press enter in the google autocomplete dropdown
	input.on('keydown', e => {
		if (e.keyCode === 13) e.preventDefault();
	});
}

export default autocomplete;

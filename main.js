const type = document.querySelector('#type');
const distance = document.querySelector('#distance');
const duration = document.querySelector('#duration');
const cadence = document.querySelector('#cadence');
const elev = document.querySelector('#elevgain');
const form = document.querySelector('form');
const list__items = document.querySelector('.list__items');
class Workout {
  _id = (Date.now()+ '').slice(-10);
  #date = new Date();
  constructor(distance, duration, coords){ 
    this._distance = distance;
    this._duration = duration;
    this._coords = coords;
    this._setDescription();
  }
  _setDescription(){
    const months = ["January", "February", "March", "April", "May", "June","July", "August","September", "October", "November", "December"];
    this._description = `${this._nameAction} on ${months[this.#date.getMonth()]} ${this.#date.getDate()}`
  }
  
}
// const t = new Workout(1, 25, 45, [53, 89], new Date());
// t.showList();
class Running extends Workout {
  _nameAction = 'Running';
  constructor(distance, duration, coords, cadence){
    super(distance, duration, coords);
    this._cadence = cadence;
    this._calcPace();
    this._setDescription();
  }
  _calcPace(){
    this._pace =  this._duration / this._distance;
    return this._pace;
  }
}
class Cycling extends Workout {
  _nameAction = 'Cycling';
  constructor( distance, duration, coords, elevationGain){
    super(distance, duration, coords);
    this._elevationGain = elevationGain;
    this._calcSpeed();
    this._setDescription();
  }
  _calcSpeed(){
    this._speed = this._distance/(this._duration/60);
    return this._speed;
  }
}
class App {
  #workouts = [];
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  constructor(){
    this._getPosition();
    type.addEventListener('change', this._toggleElevationField.bind(this));
    form.addEventListener('keydown', this._newWorkout.bind(this));
    list__items.addEventListener('click', this._moveClickList.bind(this));
    window.addEventListener('load', this._loadLocalStage.bind(this));
    window.addEventListener('beforeunload', this._saveLocalStage.bind(this));
  }
  _getPosition(){
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this) ,function () {
          alert("Don't get your geolocation");
        }
      );
    }
  }
  _moveClickList(e){
    const target = e.target.closest('.list__item');
    if(!target) return;
    const workout = this.#workouts.find(w => w._id === target.dataset.id);
    this.#map.setView(workout._coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1
      }
    });
  }
  _loadLocalStage(){
      let data = JSON.parse(window.localStorage.getItem("map"));
      if(data){
        this.#workouts = data;
        setTimeout(()=>{
          this.#workouts.forEach(w=>{
            this._renderList(w);
            console.log(this.#map);
          });
        })
      }   
      
  }
  _saveLocalStage(e){
    e.preventDefault();
    window.localStorage.setItem("map", JSON.stringify(this.#workouts));
  }
  _loadMap(position){
          const { longitude, latitude } = position.coords;
          this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
          console.log(this.#map);
          L.tileLayer(`https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png`, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(this.#map);
          this.#map.on('click', this._showForm.bind(this));
          this.#workouts.forEach(w=>{
            this._markupMap(w);
          })
  }
  _showForm(mapE){
          const {lat, lng}= mapE.latlng;
          this.#mapEvent = [lat, lng];
          form.classList.remove('hidden__form');
          distance.focus();
  }
  _hiddenForm(){
        form.classList.add('hidden__form');
  }
  _toggleElevationField(){
    cadence.closest('.form__item').classList.toggle('form__hidden__row');
    elev.closest('.form__item').classList.toggle('form__hidden__row');
  }
  _markupMap(work){
    L.marker(work._coords).addTo(this.#map)
    .bindPopup(L.popup({
      maxWidth: 250,
      minWidth: 150,
      autoClose: false,
      closeOnClick: false,
      className: `popup${work._nameAction}`,
    })).setPopupContent(`<i class="fas fa-running"></i> ${work._description}`) 
    .openPopup();
  }
  _newWorkout(e){
        if(e.key =='Enter'){
          const validInput = (...inputs) => inputs.every(input=>Number.isFinite(input));
          if(!validInput(+distance.value, +duration.value, +cadence.value, +elev.value)){
            alert('Input have to be positive numbers!');
            return;
          }
          let t;
          if(type.value =='Running') {
           t = new Running(distance.value, duration.value, this.#mapEvent, cadence.value);
            this.#workouts.push(t);
         }
         if(type.value == "Cycling") {
           t = new Cycling(distance.value, duration.value, this.#mapEvent, elev.value);
            this.#workouts.push(t); 
         }
         this._markupMap(t);
         this._renderList(t);
         this._hiddenForm();
         distance.value = duration.value = cadence.value = elev.value = '';
    }
  }
  _renderList(workout){
    let html = `
      <li class="list__item ${workout._nameAction.toLowerCase()}__action" data-id=${workout._id}>
      <h3>${workout._description}</h3>
      <p><i class="fas fa-running"></i><span>${workout._distance} KM</span>
        <i class="fas fa-stopwatch"></i><span>${workout._duration} MIN</span>
    `
    if(workout._nameAction ==='Cycling'){
      html+=`<i class="fas fa-bolt"></i><span>${(workout._speed).toFixed(2)} MIN/KM</span>
      <i class="fas fa-cogs"></i><span>${workout._elevationGain} SPM</span>
       </p>
      </li>`
    }
    else {
      html+= `
      <i class="fas fa-bolt"></i><span>${Math.round(workout._pace).toFixed(2)} MIN/KM</span>
        <i class="fas fa-shoe-prints"></i><span>${workout._cadence} SPM</span>
      </p>
      </li>`
    }
    list__items.insertAdjacentHTML('afterbegin', html);
  }
}
const app = new App()

from flask import Flask, request

import requests
import time

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/api/find_parks", methods=['GET', 'POST'])
def find_parks():
    parks = []
    dataDict = request.get_json()
    for data in dataDict['markers']:
        response = requests.get(f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={data['lat']},{data['lng']}&radius={dataDict['radius']}&type=park&key={dataDict['key']}").json()
        for park in response['results']:
            flag2 = True
            for compPark in parks:
                if (compPark['geometry']['location']['lat'] == park['geometry']['location']['lat'] and compPark['geometry']['location']['lng'] == park['geometry']['location']['lng']):
                    flag2 = False
            if (flag2):
                parks.append(park)
        if ('next_page_token' in response.keys()):
            time.sleep(2)
            response1 = requests.get(f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?key={dataDict['key']}&pagetoken={response['next_page_token']}").json()
            for park in response1['results']:
                flag = True
                for compPark in parks:
                    if (compPark['geometry']['location']['lat'] == park['geometry']['location']['lat'] and compPark['geometry']['location']['lng'] == park['geometry']['location']['lng']):
                        flag = False
                if (flag):
                    parks.append(park)
            if ('next_page_token' in response1.keys()):
                time.sleep(2)
                response2 = requests.get(f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?key={dataDict['key']}&pagetoken={response1['next_page_token']}").json()
                for park in response2['results']:
                    flag1 = True
                    for compPark in parks:
                        if (compPark['geometry']['location']['lat'] == park['geometry']['location']['lat'] and compPark['geometry']['location']['lng']== park['geometry']['location']['lng']):
                            flag1 = False
                    if (flag1):
                        parks.append(park)
        print('search loop done')


    print('search done')
    return {'parks': parks}
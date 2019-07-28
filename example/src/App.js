import React, { Component } from 'react'

import { FormContainer, ShortTextField, NumberField, DateField, MultipleChoiceFIeld } from 'react-formtype'

const opts = ['Banana', 'Apple', 'Orange', 'Chicken Wings']

export default class App extends Component {

  submit = (data) => {
    console.log(data)
  }

  render () {
    return (
      <FormContainer 
        showProgress={true} 
        onSubmit={this.submit}
        submitTitle="Thanks!" 
        submitButtonText="Send form"
        submitDescription="You will have your oranges shortly."
      >
        <ShortTextField title="What is your name?" name="name" minTextLength={5} required />
        <MultipleChoiceFIeld title="Select the fruit you like" name="fruits" options={opts} multiple/>
        <NumberField 
          title="How many oranges would you like?" 
          name="noranges" 
          min={0} 
          max={10}
          defaultValue={5}
        />
        <DateField title="When would you like your oranges?" name="orrangedate" required />
      </FormContainer>
    )
  }
}
